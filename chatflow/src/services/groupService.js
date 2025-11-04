import { apiClient } from '@/services/apiClient'

export const normalizeGroup = (item = {}, index = 0) => {
  const id = item.id ?? `group-${index}`
  const name = item.groupName ?? item.name ?? `群聊 ${index + 1}`
  const avatar =
    item.groupAvatarFullUrl ??
    item.avatarFullUrl ??
    item.avatarUrl ??
    item.avatar ??
    ''
  const roleValue = Number(item.role)
  return {
    ...item,
    id,
    name,
    avatar,
    role: Number.isNaN(roleValue) ? null : roleValue,
  }
}

export const fetchNormalizedGroups = async () => {
  const { data } = await apiClient.post('/group/groupList', {})
  let rawList = []
  if (Array.isArray(data)) {
    data.forEach((entry) => {
      if (Array.isArray(entry?.groupList)) {
        rawList = rawList.concat(entry.groupList)
      }
    })
  } else if (Array.isArray(data?.groupList)) {
    rawList = data.groupList
  }
  return rawList.map((item, index) => normalizeGroup(item, index))
}

/**
 * 获取群组详情
 * @param {number} groupId - 群组ID
 * @returns {Promise<Object>} 群组详情数据
 */
export const fetchGroupDetail = async (groupId) => {
  const { data } = await apiClient.post('/group/groupDetail', { param: groupId })
  return {
    id: data.id,
    groupName: data.groupName,
    announcement: data.announcement,
    members: data.members || []
  }
}

/**
 * 移除群成员
 * @param {number} groupId - 群组ID
 * @param {number} memberId - 成员ID
 * @returns {Promise<void>}
 */
export const removeGroupMember = async (groupId, memberId) => {
  await apiClient.post('/group/removeMember', { 
    groupId, 
    memberId 
  })
}
