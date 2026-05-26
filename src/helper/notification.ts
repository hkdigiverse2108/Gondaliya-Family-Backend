import admin from 'firebase-admin'
import fs from 'fs'
import path from 'path'
import { notificationModel, userModel } from '../database'
import { createData, getFirstMatch, insertMany } from './database-service'
import { redisDelPattern } from './redis'

export type DispatchNotificationPayload = {
    title: string
    body: string
    type: string
    refId: string
    sendPush?: boolean
}

let messaging: admin.messaging.Messaging | null = null
let initAttempted = false

const getMessaging = (): admin.messaging.Messaging | null => {
    if (messaging) return messaging
    if (initAttempted) return null
    initAttempted = true

    try {
        if (admin.apps.length > 0) {
            messaging = admin.messaging()
            return messaging
        }

        const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
        if (serviceAccountPath) {
            const resolved = path.resolve(serviceAccountPath)
            const serviceAccount = JSON.parse(fs.readFileSync(resolved, 'utf8'))
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            })
        } else if (
            process.env.FIREBASE_PROJECT_ID &&
            process.env.FIREBASE_CLIENT_EMAIL &&
            process.env.FIREBASE_PRIVATE_KEY
        ) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                }),
            })
        } else {
            console.warn(
                'FCM: Firebase Admin not configured. Add FIREBASE_SERVICE_ACCOUNT_PATH (recommended) or FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY. Legacy FCM_KEY no longer works (404).'
            )
            return null
        }

        messaging = admin.messaging()
        return messaging
    } catch (err) {
        console.error('FCM: Firebase Admin init failed:', err)
        return null
    }
}

const stringifyData = (data: Record<string, unknown>): Record<string, string> => {
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
            out[key] = String(value)
        }
    }
    return out
}

const sendPushToTokens = async (
    tokens: string[],
    data: Record<string, unknown>,
    notification: { title: string; body: string }
) => {
    const fcm = getMessaging()
    if (!fcm) return

    const uniqueTokens = [...new Set(tokens.filter((t) => typeof t === 'string' && t.trim()))]
    if (!uniqueTokens.length) return

    const payload = {
        notification,
        data: stringifyData(data),
        android: { priority: 'high' as const },
    }

    const chunkSize = 500
    for (let i = 0; i < uniqueTokens.length; i += chunkSize) {
        const chunk = uniqueTokens.slice(i, i + chunkSize)
        const response = await fcm.sendEachForMulticast({
            ...payload,
            tokens: chunk,
        })

        if (response.failureCount > 0) {
            response.responses.forEach((result, index) => {
                if (!result.success) {
                    console.error(
                        `FCM token failed [${chunk[index]?.slice(0, 12)}...]:`,
                        result.error?.code,
                        result.error?.message
                    )
                }
            })
        }
    }
}

export const notification_to_user = async (
    sender_user_data: { deviceToken?: string[] },
    data: Record<string, unknown>,
    notification: { title: string; body: string }
) => {
    if (!sender_user_data?.deviceToken?.length) return true
    await sendPushToTokens(sender_user_data.deviceToken, data, notification)
    return true
}

export const notification_to_multiple_user = async (
    multiple_user_data: { deviceToken?: string[] }[],
    data: Record<string, unknown>,
    notification: { title: string; body: string }
) => {
    const deviceTokens: string[] = []
    for (const user of multiple_user_data) {
        if (user?.deviceToken?.length) {
            deviceTokens.push(...user.deviceToken)
        }
    }
    if (!deviceTokens.length) return true
    await sendPushToTokens(deviceTokens, data, notification)
    return true
}

export const dispatchNotification = async ({
    userId,
    title,
    body,
    type,
    refId,
    sendPush = true,
}: DispatchNotificationPayload & { userId: string }) => {
    const user = await getFirstMatch(
        userModel,
        { _id: userId, isDeleted: false },
        { _id: 1, deviceToken: 1 },
        {}
    )
    if (!user) return null

    const notification = await createData(notificationModel, {
        userId: user._id,
        title,
        body,
        type,
        refId,
    })

    await redisDelPattern(`notifications:list:${userId}`)

    if (sendPush && user.deviceToken?.length) {
        notification_to_user(
            user,
            { refId: String(refId), type },
            { title, body }
        ).catch((err) => {
            console.error('FCM Notification Error:', err?.message || err)
        })
    }

    return notification
}

export const dispatchNotificationToUsers = async (
    users: { _id: unknown; deviceToken?: string[] }[],
    payload: DispatchNotificationPayload
) => {
    const { title, body, type, refId, sendPush = true } = payload
    if (!users.length) return []

    const notifs = users.map((u) => ({
        userId: u._id,
        title,
        body,
        type,
        refId,
    }))
    const created = await insertMany(notificationModel, notifs)
    await redisDelPattern('notifications:list:*')

    if (sendPush) {
        const usersWithTokens = users.filter((u) => u.deviceToken?.length)
        if (usersWithTokens.length > 0) {
            notification_to_multiple_user(
                usersWithTokens,
                { refId: String(refId), type },
                { title, body }
            ).catch((err) => {
                console.error('FCM Bulk Notification Error:', err?.message || err)
            })
        }
    }

    return created
}
