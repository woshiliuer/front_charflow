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
