import gcm from 'node-gcm'
import { notificationModel, userModel } from '../database'
import { createData, getFirstMatch, insertMany } from './database-service'
import { redisDelPattern } from './redis'

const sender = new gcm.Sender(process.env.FCM_KEY)

export type DispatchNotificationPayload = {
    title: string
    body: string
    type: string
    refId: string
    sendPush?: boolean
}

export const notification_to_user = async (sender_user_data: any, data: any, notification: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (sender_user_data && data && notification && sender_user_data?.deviceToken?.length != 0 && sender_user_data != undefined && sender_user_data != null) {
                let message = new gcm.Message({
                    data: data,
                    notification: notification
                });
                sender.send(message, {
                    registrationTokens: sender_user_data?.deviceToken
                }, function (err, response) {
                    if (err) {
                        reject(err)
                    } else {
                        resolve(response)
                    }
                })
            }
            else {
                resolve(true)
            }
        } catch (error) {
            reject(error)
        }
    })
}

export const notification_to_multiple_user = async (multiple_user_data: any, data: any, notification: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            if (multiple_user_data && data && notification) {
                let deviceToken: any = []
                for (let i = 0; i < multiple_user_data?.length; i++) {
                    deviceToken.push(...multiple_user_data[i]?.deviceToken)
                }
                if (deviceToken.length != 0) {
                    let message = new gcm.Message({
                        data: data,
                        notification: notification
                    });
                    sender.send(message, {
                        registrationTokens: deviceToken
                    }, function (err, response) {
                        if (err) {
                            reject(err)
                        } else {
                            resolve(response)
                        }
                    })
                }
                else {
                    resolve(true)
                }
            }
            else {
                resolve(true)
            }
        } catch (error) {
            reject(error)
        }
    })
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
            console.error('FCM Notification Error:', err)
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
                console.error('FCM Bulk Notification Error:', err)
            })
        }
    }

    return created
}
