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
    members: data.members || [],
    introduction: data.introduction,
    memberCount: data.memberCount,
    onlineCount: data.onlineCount,
    role: data.role,
    avatarFullUrl: data.avatarFullUrl,
  }
}

/**
 * 新建群聊
 * @param {Object} payload
 * @param {string} payload.groupName
 * @param {Array<number|string>} payload.memberIds
 */
export const createGroup = async ({ groupName, memberIds }) => {
  if (!groupName) throw new Error('群聊名称不能为空')
  const ids = Array.isArray(memberIds) ? memberIds : []
  return apiClient.post('/group/addGroup', {
    groupName,
    memberIds: ids,
  })
}

/**
 * 解散群聊
 * @param {number|string} groupId
 * @returns {Promise<void>}
 */
export const dissolveGroup = async (groupId) => {
  if (groupId === null || groupId === undefined || groupId === '') {
    throw new Error('群聊ID不能为空')
  }
  await apiClient.post('/group/dissolve', { param: groupId })
}

/**
 * 编辑群聊（名称/简介/公告）
 * @param {object} payload
 * @param {number|string} payload.groupId
 * @param {string} payload.groupName
 * @param {string} [payload.introduction]
 * @param {string} [payload.announcement]
 */
export const editGroup = async ({ groupId, groupName, introduction = '', announcement = '' }) => {
  if (groupId === null || groupId === undefined || groupId === '') {
    throw new Error('群聊ID不能为空')
  }
  if (!groupName) {
    throw new Error('群聊名称不能为空')
  }
  return apiClient.post('/group/edit', {
    groupId,
    groupName,
    introduction,
    announcement,
  })
}

/**
 * 邀请新成员
 * @param {number|string} groupId
 * @param {Array<number|string>} memberIds
 */
export const inviteMembers = async (groupId, memberIds = []) => {
  if (!groupId) throw new Error('群聊ID不能为空')
  const ids = Array.isArray(memberIds) ? memberIds : []
  if (!ids.length) throw new Error('成员ID列表不能为空')
  return apiClient.post('/group/inviteMembers', {
    groupId,
    memberIds: ids,
  })
}

/**
 * 批量移除成员
 * @param {number|string} groupId
 * @param {Array<number|string>} memberIds
 */
export const removeGroupMembers = async (groupId, memberIds = []) => {
  if (!groupId) throw new Error('群聊ID不能为空')
  const ids = Array.isArray(memberIds) ? memberIds : []
  if (!ids.length) throw new Error('成员ID列表不能为空')
  return apiClient.post('/group/removeMembers', {
    groupId,
    memberIds: ids,
  })
}
