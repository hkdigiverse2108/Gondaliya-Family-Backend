import { userModel, locationModel } from '../../database';
import { responseSuccess, internalServerError } from '../../common';
import { reqInfo } from '../../helper';

export const getDashboardStats = async (req, res) => {
    reqInfo(req);
    try {
        // Concurrently fetch all necessary data projection-optimized
        const [users, locations, recentUsers] = await Promise.all([
            userModel.find({ isDeleted: false }, {
                bloodGroup: 1,
                houseType: 1,
                village: 1,
                'familyMembers.bloodGroup': 1,
                isActive: 1
            }) as any,
            locationModel.find({ isDeleted: false }, { district: 1 }) as any,
            userModel.find({ isDeleted: false }, { firstName: 1, lastName: 1, phoneNumber: 1, village: 1, isActive: 1 })
                .sort({ createdAt: -1 })
                .limit(5) as any
        ]);

        const totalMembers = users.length;
        const activeMembers = users.filter((u: any) => u.isActive).length;
        const totalVillages = locations.length;
        const totalDistricts = new Set(locations.map((l: any) => l.district).filter(Boolean)).size;

        // 1. Blood Groups distribution (both Head and Family Members)
        const bloodGroups: { [key: string]: number } = {};
        users.forEach((u: any) => {
            if (u.bloodGroup) {
                bloodGroups[u.bloodGroup] = (bloodGroups[u.bloodGroup] || 0) + 1;
            }
            if (u.familyMembers && Array.isArray(u.familyMembers)) {
                u.familyMembers.forEach((m: any) => {
                    if (m.bloodGroup) {
                        bloodGroups[m.bloodGroup] = (bloodGroups[m.bloodGroup] || 0) + 1;
                    }
                });
            }
        });
        const bloodGroupData = Object.keys(bloodGroups).map(key => ({
            name: key,
            value: bloodGroups[key]
        })).sort((a, b) => b.value - a.value);

        // 2. House Type distribution
        const houseTypes: { [key: string]: number } = {};
        users.forEach((u: any) => {
            if (u.houseType) {
                houseTypes[u.houseType] = (houseTypes[u.houseType] || 0) + 1;
            }
        });
        const houseTypeData = Object.keys(houseTypes).map(key => ({
            name: key,
            value: houseTypes[key]
        }));

        // 3. Top Villages count
        const villages: { [key: string]: number } = {};
        users.forEach((u: any) => {
            if (u.village) {
                villages[u.village] = (villages[u.village] || 0) + 1;
            }
        });
        const villageData = Object.keys(villages)
            .map(key => ({ name: key, count: villages[key] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        return responseSuccess(res, "Dashboard stats fetched successfully", {
            stats: {
                totalMembers,
                activeMembers,
                totalVillages,
                totalDistricts
            },
            recentUsers,
            bloodGroupData,
            houseTypeData,
            villageData
        });
    } catch (error: any) {
        console.error("Error fetching dashboard statistics:", error);
        return internalServerError(res, error);
    }
};