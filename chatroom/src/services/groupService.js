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

export const createGroup = async ({ groupName, memberIds }) => {
  if (!groupName) throw new Error('群聊名称不能为空')
  const ids = Array.isArray(memberIds) ? memberIds : []
  return apiClient.post('/group/addGroup', {
    groupName,
    memberIds: ids,
  })
}

export const dissolveGroup = async (groupId) => {
  if (groupId === null || groupId === undefined || groupId === '') {
    throw new Error('群聊ID不能为空')
  }
  await apiClient.post('/group/dissolve', { param: groupId })
}

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

export const inviteMembers = async (groupId, memberIds = []) => {
  if (!groupId) throw new Error('群聊ID不能为空')
  const ids = Array.isArray(memberIds) ? memberIds : []
  if (!ids.length) throw new Error('成员ID列表不能为空')
  return apiClient.post('/group/inviteMembers', {
    groupId,
    memberIds: ids,
  })
}

export const removeGroupMembers = async (groupId, memberIds = []) => {
  if (!groupId) throw new Error('群聊ID不能为空')
  const ids = Array.isArray(memberIds) ? memberIds : []
  if (!ids.length) throw new Error('成员ID列表不能为空')
  return apiClient.post('/group/removeMembers', {
    groupId,
    memberIds: ids,
  })
}
