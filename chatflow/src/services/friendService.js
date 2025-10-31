import { apiClient } from '@/services/apiClient'

export const mapFriendStatus = (status) => {
  if (typeof status === 'string') {
    const normalized = status.trim().toLowerCase()
    if (normalized === 'online') return 'online'
    if (normalized === 'offline') return 'offline'
    return normalized
  }
  const value = Number(status)
  if (Number.isNaN(value)) return 'offline'
  if (value === 1) return 'online'
  if (value === 2) return 'offline'
  return 'offline'
}

export const normalizeFriend = (item = {}, index = 0) => {
  const idCandidate =
    item.id ??
    item.friendId ??
    item.userId ??
    item.targetId ??
    `friend-${index}`
  let resolvedId = idCandidate
  if (typeof idCandidate === 'string') {
    const parsed = Number(idCandidate)
    if (!Number.isNaN(parsed)) {
      resolvedId = parsed
    }
  } else if (typeof idCandidate === 'number') {
    resolvedId = idCandidate
  }
  const displayName =
    item.remark ??
    item.nickname ??
    item.name ??
    item.username ??
    `好友 ${index + 1}`
  const userIdCandidate = item.userId ?? resolvedId
  const normalizedUserId = (() => {
    const numeric = Number(userIdCandidate)
    if (!Number.isNaN(numeric)) return numeric
    return userIdCandidate
  })()
  return {
    ...item,
    id: resolvedId,
    userId: normalizedUserId,
    avatar:
      item.avatarFullUrl ??
      item.avatarUrl ??
      item.avatar ??
      '',
    nameEn: displayName,
    nameCn: item.nameCn ?? '',
    description: item.description ?? item.signature ?? '',
    lastActive: item.lastActive ?? '',
    status: mapFriendStatus(item.status),
  }
}

export const fetchFriends = async () => {
  const { data } = await apiClient.post('/friend/getFriends', {})
  return Array.isArray(data) ? data : []
}

export const fetchNormalizedFriends = async () => {
  const list = await fetchFriends()
  return list.map((item, index) => normalizeFriend(item, index))
}
