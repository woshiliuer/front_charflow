<template>
  <div class="chat-app">
    <nav class="nav-rail">
      <div class="nav-avatar" @click="showUserMenu = !showUserMenu">
        <img v-if="currentUser.avatarFullUrl" :src="currentUser.avatarFullUrl" />
        <span v-else class="avatar-letter">{{ userInitial }}</span>
      </div>
      <div class="nav-items">
        <button v-for="item in navItems" :key="item.id" class="nav-btn" :class="{ active: activeNav === item.id }" :title="item.label" @click="switchNav(item.id)">
          <component :is="item.icon" />
          <span v-if="item.id === 'contacts' && friendRequests.pendingCount" class="nav-badge">{{ friendRequests.pendingCount }}</span>
        </button>
      </div>
      <button class="nav-btn logout" title="退出登录" @click="handleLogout"><IconLogout /></button>
    </nav>

    <teleport to="body">
      <div v-if="showUserMenu" class="overlay-clear" @click="showUserMenu = false">
        <div class="user-popover" @click.stop>
          <div class="pop-header">
            <div class="pop-avatar"><img v-if="currentUser.avatarFullUrl" :src="currentUser.avatarFullUrl" /><span v-else class="avatar-letter lg">{{ userInitial }}</span></div>
            <div><div class="pop-name">{{ currentUser.nickname || '用户' }}</div><div class="pop-email">{{ currentUser.email }}</div></div>
          </div>
          <div class="pop-actions">
            <button @click="openProfileModal">编辑资料</button>
            <button @click="openResetPwModal">修改密码</button>
            <button @click="openNotifSettings">通知设置</button>
            <button class="danger" @click="handleLogout">退出登录</button>
          </div>
        </div>
      </div>
    </teleport>

    <aside class="sidebar" :style="{ width: sidebarWidth + 'px' }">
      <header class="sidebar-header">
        <h2>{{ sidebarTitle }}</h2>
        <div class="sidebar-tools">
          <button v-if="activeNav === 'chat'" class="tool-btn" title="添加好友" @click="showAddFriend = true"><IconUserPlus /></button>
          <button v-if="activeNav === 'chat'" class="tool-btn" title="创建群聊" @click="handleStartGroup"><IconGroup /></button>
          <button v-if="activeNav === 'dynamic'" class="tool-btn" title="发布动态" @click="openPublishFeed"><IconEdit /></button>
        </div>
      </header>
      <div v-if="activeNav === 'chat' || activeNav === 'contacts'" class="sidebar-search">
        <input v-model="searchTerm" :placeholder="activeNav === 'contacts' ? '搜索好友...' : '搜索会话...'" />
      </div>

      <!-- Conversations -->
      <div v-if="activeNav === 'chat'" class="sidebar-list">
        <div v-for="conv in filteredConversations" :key="conv.id" class="list-item" :class="{ active: activeConversationId === conv.id }" @click="selectConversation(conv.id)" @contextmenu.prevent="openCtxMenu(conv, $event)">
          <div class="item-avatar"><img :src="conv.avatar" /><span v-if="conv.unread > 0" class="badge">{{ conv.unread > 99 ? '99+' : conv.unread }}</span></div>
          <div class="item-body"><div class="item-top"><span class="item-name">{{ conv.displayName }}</span><span v-if="conv.isGroupConversation" class="tag">群</span><span class="item-time">{{ conv.clock }}</span></div><div class="item-sub">{{ conv.snippet }}</div></div>
        </div>
        <div v-if="!filteredConversations.length" class="empty-hint">暂无会话</div>
      </div>

      <!-- Contacts -->
      <div v-else-if="activeNav === 'contacts'" class="sidebar-list">
        <div v-if="friendRequests.incoming.filter(r => r.requestStatus === 0).length" class="section-label">好友请求</div>
        <div v-for="req in friendRequests.incoming.filter(r => r.requestStatus === 0)" :key="req.id" class="req-item">
          <div class="req-info"><strong>{{ req.nickname || '未知' }}</strong><span>{{ req.applyMessage || '请求添加好友' }}</span></div>
          <div class="req-btns"><button class="btn-xs accent" @click="handleApproveReq(req)">同意</button><button class="btn-xs" @click="handleRejectReq(req)">拒绝</button></div>
        </div>
        <div class="section-label">好友 ({{ filteredContacts.length }})</div>
        <div v-for="f in filteredContacts" :key="f.id" class="list-item" @click="handleFriendClick(f)">
          <div class="item-avatar sm"><img :src="f.avatar || DEFAULT_AVATAR" /><span class="dot" :class="f.status"></span></div>
          <div class="item-body"><span class="item-name">{{ f.nameEn }}</span><span class="item-sub">{{ f.description }}</span></div>
        </div>
        <div class="section-label" style="margin-top:8px">群聊 ({{ groups.length }})</div>
        <div v-for="g in groups" :key="g.id" class="list-item" @click="handleGroupClick(g)">
          <div class="item-avatar sm"><img :src="g.avatar || DEFAULT_AVATAR" /></div>
          <div class="item-body"><span class="item-name">{{ g.name }}</span></div>
        </div>
        <div v-if="!filteredContacts.length && !groups.length" class="empty-hint">暂无联系人</div>
      </div>

      <!-- Dynamic -->
      <div v-else-if="activeNav === 'dynamic'" class="sidebar-list feed-list">
        <div v-for="feed in dynamicList" :key="feed.id" class="feed-card" :class="{ active: activeFeedId === feed.id }" @click="selectFeed(feed.id)" style="cursor:pointer">
          <div class="feed-header"><img :src="feed.avatarFullUrl || DEFAULT_AVATAR" class="feed-avatar" /><div><strong>{{ feed.nickname || '用户' }}</strong><span class="feed-time">{{ formatFeedTime(feed.createTime) }}</span></div>
            <button v-if="feed.isMine" class="btn-xs danger" style="margin-left:auto" @click.stop="handleDeleteFeed(feed.id)">删除</button>
          </div>
          <div class="feed-content">{{ feed.content }}</div>
          <div v-if="feed.files && feed.files.length" class="feed-images"><img v-for="(file, fi) in feed.files" :key="fi" :src="file.fullFilePath || file.filePath" class="feed-img" /></div>
          <div class="feed-actions">
            <button :class="{ liked: feed.isLiked }" @click="handleToggleLike(feed)">{{ feed.isLiked ? '❤️' : '🤍' }} {{ feed.likeCount || 0 }}</button>
            <button @click="feed._showComments = !feed._showComments">💬 {{ feed.commentCount || 0 }}</button>
          </div>
          <div v-if="feed._showComments" class="feed-comments">
            <div v-for="c in (feed.comments || [])" :key="c.id" class="comment-item"><strong>{{ c.nickname || '用户' }}</strong>: {{ c.content }}<button v-if="c.isMine" class="btn-link danger" @click="handleDeleteComment(feed, c.id)">删除</button></div>
            <div class="comment-input"><input v-model="feed._commentDraft" placeholder="写评论..." @keydown.enter="handleComment(feed)" /><button class="btn-xs accent" @click="handleComment(feed)">发送</button></div>
          </div>
        </div>
        <div v-if="!dynamicList.length" class="empty-hint">暂无动态</div>
      </div>

      <!-- Favorites -->
      <div v-else-if="activeNav === 'favorites'" class="sidebar-list">
        <div v-for="fav in favoriteList" :key="fav.id" class="fav-item" :class="{ active: activeFavoriteId === fav.id }" @click="selectFavorite(fav)" style="cursor:pointer">
          <div class="fav-content">{{ fav.content || fav.text || '[收藏]' }}</div>
          <div class="fav-meta"><span>{{ formatFeedTime(fav.createTime) }}</span><button class="btn-link danger" @click.stop="handleDeleteFavorite(fav.id)">删除</button></div>
        </div>
        <div v-if="!favoriteList.length" class="empty-hint">暂无收藏</div>
      </div>

      <!-- Emoji Manager -->
      <div v-else-if="activeNav === 'emoji'" class="sidebar-list emoji-mgr">
        <div style="padding:8px 10px 0"><button class="btn-block accent" @click="openEmojiManager">搜索添加表情包</button></div>
        <div class="section-label">我的表情包</div>
        <div v-for="pack in emojiPacks" :key="pack.id" class="emoji-pack-row" :class="{ active: selectedEmojiPackId === pack.id }" @click="selectEmojiPack(pack.id)">
          <div class="item-avatar sm"><img v-if="pack.cover?.fullFilePath" :src="pack.cover.fullFilePath" /><span v-else class="avatar-letter">{{ (pack.name || '?')[0] }}</span></div>
          <div class="emoji-pack-info"><div class="item-name">{{ pack.name }}</div><div class="item-sub">{{ pack.type === 1 ? '默认' : '已订阅' }}</div></div>
          <div class="emoji-pack-actions" @click.stop>
            <button v-if="Number(pack.type) !== 1 && Number(pack.type) !== 2" class="btn-xs danger" @click="handleUnbindPack(pack.id)">移除</button>
          </div>
        </div>
        <div v-if="selectedEmojiPackId" class="section-label" style="margin-top:8px">表情列表</div>
        <div v-if="selectedEmojiPackId" class="emoji-grid">
          <div v-for="item in selectedEmojiItems" :key="item.id" class="emoji-cell" :title="item.name">
            <template v-if="item.type === 1">{{ item.unicodeVal }}</template>
            <img v-else :src="item.file?.fullFilePath || item.emojiItemFile?.fullFilePath" />
            <button v-if="isSelectedEmojiPackCustom && item.type !== 1" class="emoji-del" @click.stop="handleDeleteEmojiItem(item)" title="删除">✕</button>
          </div>
        </div>
      </div>

      <!-- Settings -->
      <div v-else-if="activeNav === 'settings'" class="sidebar-list settings-list">
        <div class="settings-section">
          <div class="settings-item" @click="openProfileModal"><span>个人资料</span><span class="arrow">›</span></div>
          <div class="settings-item" @click="openResetPwModal"><span>修改密码</span><span class="arrow">›</span></div>
          <div class="settings-item" @click="openNotifSettings"><span>通知设置</span><span class="arrow">›</span></div>
        </div>
        <div class="settings-section">
          <div class="settings-item danger" @click="handleLogout"><span>退出登录</span></div>
        </div>
      </div>
      <div class="resize-handle" @mousedown="onResizeStart"></div>
    </aside>

    <main class="main-area">
      <template v-if="activeNav === 'chat' && selectedConversation">
        <header class="chat-header">
          <div class="chat-header-left"><h3>{{ selectedConversation.displayName }}</h3><span v-if="selectedConversation.isGroupConversation" class="tag">群聊</span></div>
          <div class="chat-header-right"><button class="icon-btn" title="会话设置" @click="showSettingsDrawer = true"><IconSettings /></button></div>
        </header>
        <div class="messages-area" ref="messagesAreaRef">
          <div v-if="messagesLoading" class="loading-hint">加载中...</div>
          <div v-for="msg in selectedThread" :key="msg.id" class="msg-row" :class="msg.role" @contextmenu.prevent="openMsgCtxMenu($event, msg)">
            <div v-if="msg.role === 'contact'" class="msg-avatar"><img :src="msg.avatarFullUrl || selectedConversation.avatar" /></div>
            <div class="msg-bubble">
              <div v-if="msg.messageType === 2 && msg.messageFile" class="msg-image"><img :src="msg.messageFile.fullFilePath || msg.messageFile.fileUrl || msg.messageFile.filePath" /></div>
              <div v-else class="msg-text">{{ msg.text }}</div>
              <div class="msg-meta"><span>{{ msg.time }}</span><span v-if="msg.role === 'self' && msg.status === 0" class="sending">发送中</span><span v-if="msg.role === 'self' && msg.status === -1" class="failed">失败</span></div>
            </div>
            <div v-if="msg.role === 'self'" class="msg-avatar"><img v-if="currentUser.avatarFullUrl" :src="currentUser.avatarFullUrl" /><span v-else class="avatar-letter sm">{{ userInitial }}</span></div>
          </div>
          <div v-if="!selectedThread.length && !messagesLoading" class="empty-hint">暂无消息</div>
        </div>
        <div class="input-area">
          <label class="file-btn" title="发送图片"><IconPaperclip /><input type="file" accept="image/*" hidden @change="handleFileSelect" /></label>
          <button class="emoji-toggle" @click="showEmojiPicker = !showEmojiPicker" title="表情">😊</button>
          <input v-model="draft" class="msg-input" placeholder="输入消息..." @keydown.enter.exact.prevent="handleSendMessage" />
          <button class="send-btn" :disabled="!draft.trim()" @click="handleSendMessage">发送</button>
        </div>
        <div v-if="showEmojiPicker" class="emoji-picker">
          <div class="emoji-pack-bar">
            <button v-for="pack in chatEmojiPacks" :key="pack.id" class="emoji-pack-btn" :class="{ active: chatSelectedPackId === pack.id }" @click="selectChatEmojiPack(pack.id)">
              <img v-if="pack.cover?.fullFilePath" :src="pack.cover.fullFilePath" /><span v-else>{{ (pack.name || '?')[0] }}</span>
            </button>
          </div>
          <div class="emoji-picker-grid">
            <button v-for="item in chatSelectedEmojiItems" :key="item.id" class="emoji-pick-item" @click="handlePickEmoji(item)">
              <template v-if="item.type === 1">{{ item.unicodeVal }}</template>
              <img v-else :src="item.file?.fullFilePath || item.emojiItemFile?.fullFilePath" />
            </button>
          </div>
        </div>
        <teleport to="body">
          <div v-if="showSettingsDrawer" class="drawer-overlay" @click.self="showSettingsDrawer = false">
            <div class="drawer">
              <div class="drawer-header"><h3>会话设置</h3><button class="icon-btn" @click="showSettingsDrawer = false">✕</button></div>
              <div class="drawer-body">
                <div class="drawer-row"><span>常用会话</span><button class="toggle-btn" :class="{ on: selectedConversation.isFavorite }" @click="handleToggleFavorite(!selectedConversation.isFavorite)">{{ selectedConversation.isFavorite ? '已设置' : '未设置' }}</button></div>
                <div class="drawer-row"><span>消息免打扰</span><button class="toggle-btn" :class="{ on: selectedConversation.isMuted }" @click="handleToggleMute(!selectedConversation.isMuted)">{{ selectedConversation.isMuted ? '已开启' : '未开启' }}</button></div>
                <template v-if="selectedConversation.isGroupConversation">
                  <div class="drawer-section">群聊信息</div>
                  <div class="drawer-row"><span>群名称</span><input v-model="editGroupName" class="drawer-input" @blur="handleUpdateGroupName" /></div>
                  <div class="drawer-row"><span>群简介</span><input v-model="editGroupIntro" class="drawer-input" @blur="handleUpdateGroupIntro" /></div>
                  <div class="drawer-row"><span>群公告</span><button class="btn-link" @click="showAnnouncementModal = true">编辑</button></div>
                  <div class="drawer-section">成员 ({{ selectedConversation.members?.length || 0 }})</div>
                  <div class="drawer-members">
                    <div v-for="m in selectedConversation.members" :key="m.id || m.userId" class="member-item">
                      <img :src="m.avatarFullUrl || m.avatar || DEFAULT_AVATAR" /><span>{{ m.name || m.nickname || '成员' }}</span>
                      <button v-if="m.id !== currentUser.id && m.userId !== currentUser.id" class="btn-link danger" @click="handleRemoveMember(m)">移除</button>
                    </div>
                  </div>
                  <button v-if="canInvite" class="btn-block accent" @click="showGroupInvite = true">邀请成员</button>
                  <button class="btn-block danger" @click="handleDissolveGroup">解散群聊</button>
                </template>
                <button class="btn-block" @click="handleDeleteConversation">删除会话</button>
                <button v-if="selectedConversation.isGroupConversation" class="btn-block" @click="handleLeaveGroup">退出群聊</button>
              </div>
            </div>
          </div>
        </teleport>
      </template>
      <div v-else-if="activeNav === 'chat'" class="empty-state">
        <div class="empty-icon">💬</div><h3>选择一个会话开始聊天</h3><p>从左侧列表选择会话，或添加好友开始新对话</p>
      </div>

      <!-- Feed Detail Panel -->
      <div v-else-if="activeNav === 'dynamic' && activeFeedDetail" class="feed-detail-panel">
        <div class="feed-detail-card">
          <div class="feed-detail-header">
            <img :src="activeFeedDetail.avatarFullUrl || DEFAULT_AVATAR" />
            <div><div class="fd-name">{{ activeFeedDetail.nickname || '用户' }}</div><div class="fd-time">{{ formatFeedTime(activeFeedDetail.createTime) }}</div></div>
            <div style="margin-left:auto;display:flex;gap:6px">
              <button v-if="String(activeFeedDetail.userId) === String(currentUser.id)" class="btn-xs danger" @click="handleDeleteFeedFromDetail">删除动态</button>
            </div>
          </div>
          <div class="feed-detail-content">{{ activeFeedDetail.content }}</div>
          <div v-if="activeFeedDetail.files && activeFeedDetail.files.length" class="feed-detail-images">
            <img v-for="(file, fi) in activeFeedDetail.files" :key="fi" :src="file.fullFilePath || file.filePath" />
          </div>
          <div class="feed-detail-actions">
            <button :class="{ liked: activeFeedDetail.isLiked }" @click="handleDetailToggleLike">{{ activeFeedDetail.isLiked ? '❤️' : '🤍' }} {{ activeFeedDetail.likeCount || 0 }} 赞</button>
            <button>💬 {{ activeFeedDetail.commentCount || (activeFeedDetail.comments || []).length }} 评论</button>
          </div>
          <div class="feed-detail-comments">
            <div class="section-label">评论</div>
            <div v-for="c in (activeFeedDetail.comments || [])" :key="c.id" class="fd-comment">
              <div><strong>{{ c.nickname || '用户' }}</strong>
                <div class="fd-comment-text">{{ c.content }}</div>
                <div class="fd-comment-meta"><span>{{ formatFeedTime(c.createTime) }}</span><button v-if="String(c.userId) === String(currentUser.id)" class="btn-link danger" @click="handleDetailDeleteComment(c.id)">删除</button></div>
              </div>
            </div>
            <div v-if="!(activeFeedDetail.comments || []).length" class="empty-hint" style="padding:12px 0">暂无评论</div>
          </div>
          <div class="feed-detail-comment-input">
            <input v-model="feedDetailCommentDraft" placeholder="写评论..." @keydown.enter="handleDetailComment" />
            <button class="btn-primary" @click="handleDetailComment">发送</button>
          </div>
        </div>
      </div>

      <!-- Favorite Detail Panel -->
      <div v-else-if="activeNav === 'favorites' && activeFavoriteDetail" class="feed-detail-panel">
        <div class="feed-detail-card">
          <div class="feed-detail-header">
            <div class="item-avatar sm"><span class="avatar-letter">⭐</span></div>
            <div>
              <div class="fd-name">收藏详情</div>
              <div class="fd-time">{{ formatFeedTime(activeFavoriteDetail.createTime) }}</div>
            </div>
            <div style="margin-left:auto">
              <button class="btn-xs danger" @click="handleDeleteFavorite(activeFavoriteDetail.id)">删除收藏</button>
            </div>
          </div>
          <div class="feed-detail-content" style="white-space: pre-wrap; word-break: break-all;">
            {{ activeFavoriteDetail.content || activeFavoriteDetail.text || '[无内容]' }}
          </div>
          <!-- If it's a message collection, could potentially show more context here -->
          <div style="margin-top: 20px; padding-top: 12px; border-top: 1px solid var(--c-border-light); font-size: 12px; color: var(--c-text-4);">
            收藏类型: {{ activeFavoriteDetail.type === 1 ? '文字消息' : activeFavoriteDetail.type === 2 ? '图片消息' : '其他' }}
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">{{ activeNav === 'dynamic' ? '🪐' : activeNav === 'favorites' ? '⭐' : activeNav === 'emoji' ? '😊' : '⚙️' }}</div>
        <h3>{{ sidebarTitle }}</h3><p>{{ activeNav === 'dynamic' ? '点击左侧动态查看详情' : '在左侧面板中查看内容' }}</p>
      </div>
    </main>

    <teleport to="body">
      <ul v-if="ctxMenu.visible" class="ctx-menu" :style="{ top: ctxMenu.y + 'px', left: ctxMenu.x + 'px' }" ref="ctxMenuRef">
        <li><button @click="handleCtxFavorite">{{ ctxMenu.target?.isFavorite ? '取消常用' : '设为常用' }}</button></li>
        <li><button class="danger" @click="handleCtxDelete">删除会话</button></li>
      </ul>
    </teleport>
    <teleport to="body">
      <ul v-if="msgCtxMenu.visible" class="ctx-menu" :style="{ top: msgCtxMenu.y + 'px', left: msgCtxMenu.x + 'px' }">
        <li><button @click="handleCollectMessage">⭐ 收藏</button></li>
        <li v-if="msgCtxMenu.msg?.messageType === 2"><button @click="handleAddMsgEmoji">✨ 添加表情</button></li>
      </ul>
    </teleport>
    <teleport to="body">
      <div v-if="notification.visible" class="notif-toast" @click="handleNotifClick">
        <strong>{{ notification.senderName }}</strong><span>{{ notification.text }}</span><button @click.stop="notification.visible = false">✕</button>
      </div>
    </teleport>
    <teleport to="body">
      <div v-if="showAddFriend" class="modal-overlay" @click.self="showAddFriend = false">
        <div class="modal-card add-friend-card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>添加好友</h3>
            <button class="icon-btn" @click="showAddFriend = false" style="font-size:18px">&times;</button>
          </div>
          <p class="modal-desc">输入邮箱搜索用户，确认后发送申请</p>
          
          <form class="search-form" @submit.prevent="handleSearchUser">
            <div class="search-input-group">
              <input v-model="addFriendEmail" type="email" placeholder="输入好友邮箱" required :disabled="searchingUser" />
              <button type="submit" class="search-icon-btn" :disabled="searchingUser || !addFriendEmail.trim()" title="搜索">
                <IconSearch v-if="!searchingUser" />
                <span v-else class="loading-spinner-sm"></span>
              </button>
            </div>
          </form>

          <div v-if="searchResults.length" class="search-results-list">
            <div v-for="user in searchResults" :key="user.id" class="search-result-item" :class="{ active: searchUserResult?.id === user.id }" @click="handleSelectSearchResult(user)">
              <div class="item-avatar sm">
                <img v-if="user.avatarFullUrl" :src="user.avatarFullUrl" />
                <span v-else class="avatar-letter">{{ user.nickname?.[0]?.toUpperCase() || '?' }}</span>
              </div>
              <div class="user-meta">
                <div class="user-name">{{ user.nickname }}</div>
                <div class="user-sub">{{ user.email }}</div>
              </div>
              <span class="arrow">›</span>
            </div>
          </div>

          <div v-if="searchUserResult" class="apply-area">
            <div class="apply-form">
              <div class="field">
                <span class="field-label">验证消息</span>
                <input v-model="addFriendMsg" type="text" placeholder="写点什么..." />
              </div>
              <div class="field">
                <span class="field-label">备注名</span>
                <input v-model="addFriendRemark" type="text" placeholder="为好友设置备注" />
              </div>
            </div>

            <div class="modal-actions" style="margin-top:12px">
              <button class="btn-ghost" @click="searchUserResult = null">取消选择</button>
              <button class="btn-primary" :disabled="addingFriend" @click="handleAddFriendSubmit">{{ addingFriend ? '发送中…' : '发送申请' }}</button>
            </div>
          </div>
          <div v-else-if="searchError" class="search-error-hint">{{ searchError }}</div>
        </div>
      </div>
    </teleport>
    <teleport to="body">
      <div v-if="showCreateGroup" class="modal-overlay" @click.self="showCreateGroup = false">
        <div class="modal-card"><h3>创建群聊</h3>
          <input v-model="groupName" type="text" placeholder="群聊名称" />
          <div class="section-label" style="margin:8px 0 4px">选择成员</div>
          <div class="member-select"><label v-for="f in contacts" :key="f.id" class="member-opt"><input type="checkbox" :value="f.id" v-model="selectedMembers" /><span>{{ f.nameEn }}</span></label></div>
          <div class="modal-actions"><button class="btn-ghost" @click="showCreateGroup = false">取消</button><button class="btn-primary" :disabled="creatingGroup" @click="handleCreateGroupConfirm">{{ creatingGroup ? '创建中…' : '创建' }}</button></div>
        </div>
      </div>
    </teleport>
    <teleport to="body">
      <div v-if="showGroupInvite" class="modal-overlay" @click.self="showGroupInvite = false">
        <div class="modal-card"><h3>邀请成员</h3>
          <div class="member-select"><label v-for="f in groupInviteCandidates" :key="f.id" class="member-opt"><input type="checkbox" :value="f.id" v-model="inviteSelectedIds" /><span>{{ f.displayName }}</span></label></div>
          <div class="modal-actions"><button class="btn-ghost" @click="showGroupInvite = false">取消</button><button class="btn-primary" @click="handleInviteConfirm">邀请</button></div>
        </div>
      </div>
    </teleport>
    <teleport to="body">
      <div v-if="showAnnouncementModal" class="modal-overlay" @click.self="showAnnouncementModal = false">
        <div class="modal-card"><h3>编辑群公告</h3>
          <textarea v-model="announcementDraft" rows="4" placeholder="输入群公告内容..."></textarea>
          <div class="modal-actions"><button class="btn-ghost" @click="showAnnouncementModal = false">取消</button><button class="btn-primary" @click="handleSaveAnnouncement">保存</button></div>
        </div>
      </div>
    </teleport>
    <teleport to="body">
      <div v-if="showProfileModal" class="modal-overlay" @click.self="showProfileModal = false">
        <div class="modal-card"><h3>编辑资料</h3>
          <div class="profile-avatar-wrap">
            <div class="profile-avatar"><img v-if="currentUser.avatarFullUrl" :src="currentUser.avatarFullUrl" /><span v-else class="avatar-letter lg">{{ userInitial }}</span></div>
            <label class="btn-xs accent">更换头像<input type="file" accept="image/*" hidden @change="handleAvatarChange" /></label>
          </div>
          <label class="field"><span class="field-label">昵称</span><input v-model="profileForm.nickname" type="text" /></label>
          <label class="field"><span class="field-label">签名</span><input v-model="profileForm.signature" type="text" /></label>
          <label class="field"><span class="field-label">性别</span><select v-model="profileForm.gender"><option value="">未设置</option><option value="male">男</option><option value="female">女</option></select></label>
          <div class="modal-actions"><button class="btn-ghost" @click="showProfileModal = false">取消</button><button class="btn-primary" :disabled="updatingProfile" @click="handleProfileSave">{{ updatingProfile ? '保存中…' : '保存' }}</button></div>
        </div>
      </div>
    </teleport>
    <teleport to="body">
      <div v-if="showResetPwModal" class="modal-overlay" @click.self="showResetPwModal = false">
        <div class="modal-card"><h3>修改密码</h3>
          <p class="modal-desc">验证码将发送至: <strong>{{ currentUser.email }}</strong></p>
          <div class="modal-fields"><input v-model="resetPwCode" type="text" placeholder="验证码" /><button class="code-btn" :disabled="sendingResetCode || resetCodeCountdown > 0" @click="handleSendResetCode">{{ resetCodeCountdown > 0 ? `${resetCodeCountdown}s` : '获取验证码' }}</button></div>
          <input v-model="resetPwNew" type="password" placeholder="新密码" />
          <input v-model="resetPwConfirm" type="password" placeholder="确认新密码" />
          <div class="modal-actions"><button class="btn-ghost" @click="showResetPwModal = false">取消</button><button class="btn-primary" :disabled="resettingPw" @click="handleResetPw">{{ resettingPw ? '重置中…' : '重置密码' }}</button></div>
        </div>
      </div>
    </teleport>
    <teleport to="body">
      <div v-if="showNotifModal" class="modal-overlay" @click.self="showNotifModal = false">
        <div class="modal-card"><h3>通知设置</h3>
          <div class="drawer-row"><span>消息通知</span><button class="toggle-btn" :class="{ on: Number(currentUser.notificationEnabled) === 2 }" @click="handleToggleNotif">{{ Number(currentUser.notificationEnabled) === 2 ? '已开启' : '已关闭' }}</button></div>
          <div class="modal-actions"><button class="btn-ghost" @click="showNotifModal = false">关闭</button></div>
        </div>
      </div>
    </teleport>
    <teleport to="body">
      <div v-if="showPublishFeed" class="modal-overlay" @click.self="showPublishFeed = false">
        <div class="modal-card"><h3>发布动态</h3>
          <textarea v-model="feedDraft" rows="3" placeholder="分享你的想法..."></textarea>
          <label class="btn-xs">添加图片<input type="file" accept="image/*" multiple hidden @change="handleFeedFileSelect" /></label>
          <div v-if="feedFiles.length" class="feed-preview"><span v-for="(f, i) in feedFiles" :key="i">{{ f.name }}</span></div>
          <div class="modal-actions"><button class="btn-ghost" @click="showPublishFeed = false">取消</button><button class="btn-primary" :disabled="publishingFeed" @click="handlePublishFeed">{{ publishingFeed ? '发布中…' : '发布' }}</button></div>
        </div>
      </div>
    </teleport>
    <teleport to="body">
      <div v-if="showGroupDetail" class="modal-overlay" @click.self="showGroupDetail = false">
        <div class="modal-card group-detail-card">
          <div class="modal-header">
            <div style="flex:1"></div>
            <button class="icon-btn" @click="showGroupDetail = false">✕</button>
          </div>
          
          <div v-if="groupDetailData" class="group-detail-content">
            <div class="group-info-header">
              <div class="item-avatar lg">
                <img v-if="groupDetailData.avatarFullUrl" :src="groupDetailData.avatarFullUrl" />
                <span v-else class="avatar-letter lg">{{ (groupDetailData.groupName || '?')[0].toUpperCase() }}</span>
              </div>
              <div class="group-meta-main">
                <div class="group-name-large">{{ groupDetailData.groupName }}</div>
              </div>
            </div>

            <div class="group-info-sections">
              <div v-if="groupDetailData.announcement" class="info-section">
                <div class="section-label">群公告</div>
                <p>{{ groupDetailData.announcement }}</p>
              </div>
              <div class="info-section">
                <div class="section-label">群成员 ({{ groupDetailData.memberCount || groupDetailData.members?.length || 0 }})</div>
                <div class="group-member-grid">
                  <div v-for="m in groupDetailData.members?.slice(0, 10)" :key="m.id || m.userId" class="member-mini" :title="m.nickname || m.name">
                    <img :src="m.avatarFullUrl || m.avatar || DEFAULT_AVATAR" />
                    <span>{{ m.nickname || m.name || '成员' }}</span>
                  </div>
                  <div v-if="(groupDetailData.members?.length || 0) > 10" class="member-more">...</div>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn-ghost" @click="showGroupDetail = false">关闭</button>
            <button class="btn-primary" @click="handleSendGroupMsgFromContacts">发消息</button>
          </div>
        </div>
      </div>
    </teleport>

    <teleport to="body">
      <div v-if="showFriendDetail" class="modal-overlay" @click.self="closeFriendDetail">
        <div class="modal-card friend-detail-card">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>{{ friendDetailTitle }}</h3>
            <button class="icon-btn" @click="closeFriendDetail" style="font-size:18px">&times;</button>
          </div>

          <div class="friend-detail-header">
            <div class="item-avatar lg"><img :src="friendDetailAvatar" /><span v-if="!friendDetailAvatar" class="avatar-letter lg">{{ friendDetailInitial }}</span></div>
            <div class="friend-detail-meta">
              <div class="friend-detail-name">{{ friendDetailRemark }}</div>
              <div class="friend-detail-sub">{{ friendDetailEmail }}</div>
            </div>
          </div>

          <div v-if="friendDetailLoading" class="loading-hint">正在加载详细信息...</div>
          <div v-else class="friend-detail-body">
            <div class="kv"><span class="k">昵称</span><span class="v">{{ friendDetailNickname }}</span></div>
            <div class="kv">
              <span class="k">备注</span>
              <span class="v" style="display:flex;align-items:center;gap:8px">
                <template v-if="!isEditingRemark">
                  {{ friendDetailRemark }}
                  <button class="btn-link" @click="startEditRemark" style="font-size:12px">修改</button>
                </template>
                <template v-else>
                  <input v-model="editRemarkValue" class="edit-input" @keyup.enter="handleUpdateRemark" @keyup.esc="isEditingRemark = false" />
                  <button class="btn-xs accent" :disabled="friendUpdatingRemark" @click="handleUpdateRemark">保存</button>
                  <button class="btn-xs" @click="isEditingRemark = false">取消</button>
                </template>
              </span>
            </div>
            <div class="kv"><span class="k">个性签名</span><span class="v">{{ friendDetailSignature }}</span></div>
          </div>

          <div class="modal-actions">
            <button class="btn-ghost danger" :disabled="friendDeleting" @click="handleDeleteFriend">{{ friendDeleting ? '删除中…' : '删除好友' }}</button>
            <button class="btn-primary" :disabled="friendStartingConversation" @click="handleSendMessageToFriend">{{ friendStartingConversation ? '发起中…' : '发消息' }}</button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Emoji Manager Modal -->
    <teleport to="body">
      <div v-if="showEmojiManager" class="modal-overlay" @click.self="closeEmojiManager">
        <div class="modal-card emoji-mgr-modal">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>表情管理</h3>
            <button class="icon-btn" @click="closeEmojiManager" style="font-size:18px">&times;</button>
          </div>
          <p class="modal-desc">官方表情支持搜索添加，我的表情支持移除与管理</p>

          <div class="emoji-mgr-tabs">
            <button class="emoji-mgr-tab" :class="{ active: emojiMgrTab === 'official' }" @click="switchEmojiMgrTab('official')">官方表情</button>
            <button class="emoji-mgr-tab" :class="{ active: emojiMgrTab === 'mine' }" @click="switchEmojiMgrTab('mine')">我的表情</button>
          </div>

          <!-- Official tab search -->
          <form v-if="emojiMgrTab === 'official' && emojiMgrViewMode === 'list'" class="emoji-mgr-search" @submit.prevent="handleEmojiMgrSearch">
            <input v-model="emojiMgrKeyword" :disabled="emojiMgrLoading" placeholder="搜索表情包名称..." />
            <button type="submit" class="btn-primary" :disabled="emojiMgrLoading">{{ emojiMgrLoading ? '搜索中…' : '搜索' }}</button>
          </form>

          <!-- List view -->
          <template v-if="emojiMgrViewMode === 'list'">
            <div v-if="(emojiMgrTab === 'official' && emojiMgrLoading) || (emojiMgrTab === 'mine' && emojiMgrMyLoading)" class="loading-hint">加载中...</div>

            <!-- Official pack list -->
            <div v-else-if="emojiMgrTab === 'official'" class="emoji-mgr-pack-list">
              <div v-for="pack in emojiMgrPacks" :key="pack.id" class="emoji-mgr-pack-card" @click="openEmojiMgrPack(pack)">
                <div class="item-avatar sm"><img v-if="pack.cover?.fullFilePath" :src="pack.cover.fullFilePath" /><span v-else class="avatar-letter">🙂</span></div>
                <div class="emoji-pack-info"><div class="item-name">{{ pack.name || '未命名' }}</div></div>
                <button class="btn-primary" style="padding:5px 12px;font-size:12px" :disabled="!!pack.bound || emojiMgrBindingId === pack.id" @click.stop="handleEmojiMgrBind(pack)">{{ pack.bound ? '已添加' : emojiMgrBindingId === pack.id ? '添加中…' : '添加' }}</button>
              </div>
              <div v-if="!emojiMgrPacks.length" class="empty-hint">暂无表情包，换个关键词试试</div>
              <div v-if="emojiMgrTotal > 0" class="emoji-mgr-pagination">
                <button class="btn-ghost" :disabled="emojiMgrLoading || emojiMgrPage <= 1" @click="emojiMgrPrevPage">上一页</button>
                <span style="font-size:13px;color:var(--c-text-3)">{{ emojiMgrPage }} / {{ emojiMgrTotalPages }}</span>
                <button class="btn-ghost" :disabled="emojiMgrLoading || emojiMgrPage >= emojiMgrTotalPages" @click="emojiMgrNextPage">下一页</button>
              </div>
            </div>

            <!-- My pack list -->
            <div v-else class="emoji-mgr-pack-list">
              <div v-for="pack in emojiMgrMyPacks" :key="pack.id" class="emoji-mgr-pack-card" @click="openEmojiMgrPack(pack)">
                <div class="item-avatar sm"><img v-if="pack.cover?.fullFilePath" :src="pack.cover.fullFilePath" /><span v-else class="avatar-letter">🙂</span></div>
                <div class="emoji-pack-info"><div class="item-name">{{ pack.name || '未命名' }}</div><span v-if="Number(pack.type) === 2" class="tag">自定义</span></div>
                <button v-if="Number(pack.type) !== 2" class="btn-xs danger" :disabled="emojiMgrUnbindingId === pack.id" @click.stop="handleEmojiMgrUnbind(pack)">{{ emojiMgrUnbindingId === pack.id ? '移除中…' : '移除' }}</button>
              </div>
              <div v-if="!emojiMgrMyPacks.length" class="empty-hint">还没有添加任何表情包</div>
            </div>
          </template>

          <!-- Detail view -->
          <template v-else>
            <div class="emoji-mgr-detail-header">
              <button class="btn-ghost" @click="emojiMgrBackToList">← 返回</button>
              <h4 style="margin:0;font-size:15px">{{ emojiMgrSelectedPack?.name || '表情包' }}</h4>
              <div v-if="emojiMgrTab === 'mine'" style="margin-left:auto">
                <button v-if="Number(emojiMgrSelectedPack?.type) !== 2" class="btn-xs danger" :disabled="emojiMgrUnbindingId === emojiMgrSelectedPack?.id" @click="handleEmojiMgrUnbind(emojiMgrSelectedPack)">移除表情包</button>
              </div>
            </div>
            <div v-if="emojiMgrItemsLoading" class="loading-hint">加载中...</div>
            <div v-else class="emoji-mgr-item-grid">
              <div v-for="item in emojiMgrItems" :key="item.id" class="emoji-mgr-item">
                <button v-if="Number(emojiMgrSelectedPack?.type) === 2" class="emoji-del" :disabled="emojiMgrDeletingId === item.id" @click.stop="handleEmojiMgrDeleteItem(item)">✕</button>
                <div class="emoji-mgr-item-preview">
                  <span v-if="Number(item.type) === 1" style="font-size:28px">{{ item.unicodeVal || '🙂' }}</span>
                  <img v-else-if="item.emojiItemFile?.fullFilePath" :src="item.emojiItemFile.fullFilePath" />
                  <span v-else style="font-size:28px">🙂</span>
                </div>
                <div class="emoji-mgr-item-name">{{ item.name || '表情' }}</div>
              </div>
              <div v-if="!emojiMgrItems.length" class="empty-hint">该表情包暂无表情</div>
            </div>
          </template>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChatWebSocket } from '@/composables/useChatWebSocket'
import { fetchNormalizedFriends, fetchFriendRequests, agreeFriendRequest, rejectFriendRequest, fetchFriendDetail, deleteFriend, updateFriendRemark } from '@/services/friendService'
import { sendMessage as sendMessageAPI, fetchMessageList, markAsRead, uploadMessageFile } from '@/services/messageService'
import { fetchSessionList, restoreConversationByFriend, restoreConversationByGroup, toggleFavoriteSession, deleteSession } from '@/services/conversationService'
import { createGroup, fetchNormalizedGroups, fetchGroupDetail, editGroup, inviteMembers, removeGroupMembers, dissolveGroup } from '@/services/groupService'
import { logout as logoutApi, getUserInfo as fetchUserInfo, updateUserInfo as updateProfile, uploadAvatar as uploadUserAvatar, updateNotificationEnabled } from '@/services/userService'
import { fetchMyEmojiPackList, fetchEmojiItems, fetchEmojiPackList, bindEmojiPack, addEmojiFromMessageFile, collectEmojiItem, unbindEmojiPack, deleteCustomizeEmojiItem } from '@/services/emojiService'
import { fetchSocialFeedList, fetchSocialFeedDetail, likeSocialFeed, unlikeSocialFeed, commentSocialFeed, deleteSocialFeedComment, deleteSocialFeed, publishSocialFeed, uploadSocialFeedFiles } from '@/services/socialFeedService'
import { collectFromMessage, fetchFavoriteList, deleteFavorite } from '@/services/favoriteService'
import { requestPasswordResetCode, recoverPassword } from '@/services/passwordRecovery'
import { apiClient } from '@/services/apiClient'
import IconChat from '@/components/icons/IconChat.vue'
import IconContacts from '@/components/icons/IconContacts.vue'
import IconLogout from '@/components/icons/IconLogout.vue'
import IconUserPlus from '@/components/icons/IconUserPlus.vue'
import IconGroup from '@/components/icons/IconGroup.vue'
import IconStar from '@/components/icons/IconStar.vue'
import IconPaperclip from '@/components/icons/IconPaperclip.vue'
import IconSettings from '@/components/icons/IconSettings.vue'
import IconEdit from '@/components/icons/IconEdit.vue'
import IconEmoji from '@/components/icons/IconEmoji.vue'
import IconSearch from '@/components/icons/IconSearch.vue'

const router = useRouter()
const authStore = useAuthStore()
const DEFAULT_AVATAR = 'https://chat-flow.oss-cn-guangzhou.aliyuncs.com/default-avatar/default-person.jpg'

const activeNav = ref('chat')
const sidebarWidth = ref(300)
const draft = ref('')
const searchTerm = ref('')
const showUserMenu = ref(false)
const showAddFriend = ref(false)
const showCreateGroup = ref(false)
const showGroupInvite = ref(false)
const showAnnouncementModal = ref(false)
const showSettingsDrawer = ref(false)
const showEmojiPicker = ref(false)
const showProfileModal = ref(false)
const showResetPwModal = ref(false)
const showNotifModal = ref(false)
const showPublishFeed = ref(false)
const showGroupDetail = ref(false)
const showFriendDetail = ref(false)
const addFriendEmail = ref('')
const addFriendMsg = ref('')
const addFriendRemark = ref('')
const addingFriend = ref(false)
const searchingUser = ref(false)
const searchResults = ref([])
const searchUserResult = ref(null)
const searchError = ref('')
const groupName = ref('')
const selectedMembers = ref([])
const creatingGroup = ref(false)
const messagesLoading = ref(false)
const messagesAreaRef = ref(null)
const updatingProfile = ref(false)
const inviteSelectedIds = ref([])
const announcementDraft = ref('')
const editGroupName = ref('')
const editGroupIntro = ref('')
const feedDraft = ref('')
const feedFiles = ref([])
const publishingFeed = ref(false)
const groupDetailData = ref(null)
const activeFeedId = ref(null)
const activeFeedDetail = ref(null)
const activeFavoriteId = ref(null)
const activeFavoriteDetail = ref(null)
const feedDetailCommentDraft = ref('')

const conversations = ref([])
const activeConversationId = ref(null)
const messagesByConversation = ref({})
const contacts = ref([])
const groups = ref([])
const friendRequests = reactive({ incoming: [], outgoing: [], pendingCount: 0 })
const dynamicList = ref([])
const favoriteList = ref([])
const emojiPacks = ref([])
const selectedEmojiPackId = ref(null)
const emojiItemsByPackId = ref({})
const selectedEmojiPack = computed(() => selectedEmojiPackId.value ? (emojiPacks.value.find((p) => p?.id === selectedEmojiPackId.value) || null) : null)
const isSelectedEmojiPackCustom = computed(() => Number(selectedEmojiPack.value?.type) === 2)
const showEmojiManager = ref(false)
const emojiMgrTab = ref('official')
const emojiMgrKeyword = ref('')
const emojiMgrLoading = ref(false)
const emojiMgrPacks = ref([])
const emojiMgrTotal = ref(0)
const emojiMgrPage = ref(1)
const emojiMgrSize = ref(12)
const emojiMgrBindingId = ref(null)
const emojiMgrViewMode = ref('list')
const emojiMgrSelectedPack = ref(null)
const emojiMgrItems = ref([])
const emojiMgrItemsLoading = ref(false)
const emojiMgrDeletingId = ref(null)
const emojiMgrUnbindingId = ref(null)
const emojiMgrMyPacks = ref([])
const emojiMgrMyLoading = ref(false)
const chatEmojiPacks = ref([])
const chatSelectedPackId = ref(null)
const chatEmojiItemsByPackId = ref({})

const activeFriendId = ref(null)
const friendDetail = ref(null)
const friendDetailLoading = ref(false)
const friendStartingConversation = ref(false)
const friendDeleting = ref(false)
const friendUpdatingRemark = ref(false)
const editRemarkValue = ref('')
const isEditingRemark = ref(false)

const selectedFriend = computed(() => {
  const list = Array.isArray(contacts.value) ? contacts.value : []
  return list.find((f) => f?.id === activeFriendId.value || f?.userId === activeFriendId.value) || null
})

const friendDetailTitle = computed(() => friendDetail.value?.remark || selectedFriend.value?.remark || friendDetail.value?.nickname || selectedFriend.value?.nickname || selectedFriend.value?.nameEn || '好友信息')
const friendDetailAvatar = computed(() => friendDetail.value?.avatarFullUrl || friendDetail.value?.avatarUrl || friendDetail.value?.avatar || selectedFriend.value?.avatar || '')
const friendDetailInitial = computed(() => {
  const s = friendDetail.value?.remark || selectedFriend.value?.remark || friendDetail.value?.nickname || selectedFriend.value?.nickname || selectedFriend.value?.nameEn || ''
  return String(s).trim().charAt(0).toUpperCase() || '?'
})
const friendDetailNickname = computed(() => friendDetail.value?.nickname || selectedFriend.value?.nickname || selectedFriend.value?.nameEn || '暂无昵称')
const friendDetailRemark = computed(() => friendDetail.value?.remark || selectedFriend.value?.remark || '暂无备注')
const friendDetailEmail = computed(() => friendDetail.value?.email || selectedFriend.value?.email || '暂无邮箱')
const friendDetailSignature = computed(() => friendDetail.value?.signature || selectedFriend.value?.description || '这个人很懒，什么都没有留下')

const currentUser = reactive({ id: null, email: '', nickname: '', avatarUrl: '', avatarFullUrl: '', notificationEnabled: 2, gender: '', signature: '' })
const profileForm = reactive({ nickname: '', signature: '', gender: '' })
const resetPwCode = ref('')
const resetPwNew = ref('')
const resetPwConfirm = ref('')
const sendingResetCode = ref(false)
const resettingPw = ref(false)
const resetCodeCountdown = ref(0)
let resetCodeTimer = null
const notification = reactive({ visible: false, senderName: '', text: '', conversationId: null })
let notifTimer = null

const userInitial = computed(() => { const s = currentUser.nickname || currentUser.email || ''; return s.trim().charAt(0).toUpperCase() || '?' })
const navItems = [
  { id: 'chat', label: '会话', icon: IconChat },
  { id: 'contacts', label: '通讯录', icon: IconContacts },
  { id: 'emoji', label: '表情管理', icon: IconEmoji },
  { id: 'dynamic', label: '动态', icon: IconEdit },
  { id: 'favorites', label: '收藏夹', icon: IconStar },
  { id: 'settings', label: '设置', icon: IconSettings },
]
const sidebarTitle = computed(() => ({ chat: '消息', contacts: '通讯录', emoji: '表情管理', dynamic: '动态', favorites: '收藏夹', settings: '设置' }[activeNav.value] || ''))

const parseTs = (v) => { if (!v) return null; let ms = Number(v); if (!Number.isFinite(ms)) return null; if (ms < 1e12) ms *= 1000; const d = new Date(ms); return Number.isNaN(d.getTime()) ? null : d.getTime() }
const formatClock = (ts) => { if (!Number.isFinite(ts)) return ''; const d = new Date(ts); const now = new Date(); if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); return d.getFullYear() === now.getFullYear() ? `${m}-${day}` : `${d.getFullYear()}-${m}-${day}` }
const formatMsgTime = (ts) => { if (!ts) return ''; let ms = Number(ts); if (!Number.isFinite(ms)) return ''; if (ms < 1e12) ms *= 1000; const d = new Date(ms); if (Number.isNaN(d.getTime())) return ''; const now = new Date(); if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }); return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${d.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}` }
const formatFeedTime = (ts) => { if (!ts) return ''; let ms = Number(ts); if (!Number.isFinite(ms)) return ''; if (ms < 1e12) ms *= 1000; const d = new Date(ms); if (Number.isNaN(d.getTime())) return ''; const diff = Date.now() - d; if (diff < 60000) return '刚刚'; if (diff < 3600000) return `${Math.floor(diff/60000)}分钟前`; if (diff < 86400000) return `${Math.floor(diff/3600000)}小时前`; return `${Math.floor(diff/86400000)}天前` }

const normalizeConv = (item, i) => {
  if (!item) return null
  const rawId = item.id ?? item.sessionId ?? i; const numId = Number(rawId); const id = Number.isFinite(numId) ? numId : rawId
  const rawRelId = item.relationId; const numRelId = Number(rawRelId); const relationId = Number.isFinite(numRelId) ? numRelId : rawRelId
  const displayName = item.displayName || item.name || `会话 ${id}`
  const sendTime = parseTs(item.sendTime)
  const unread = Number(item.unreadCount); const avatar = item.avatarFullUrl || DEFAULT_AVATAR
  const statusCode = Number(item.status) || 1
  const convType = Number(item.conversationType) || 1; const isGroup = convType === 2
  const friendId = item.friendId ?? item.targetUserId ?? item.userId ?? (!isGroup ? relationId : null)
  return { id, relationId, friendId, targetUserId: item.targetUserId ?? friendId, displayName, nameEn: displayName, snippet: item.content ?? '', content: item.content ?? '', unread: Number.isFinite(unread) && unread > 0 ? unread : 0, statusCode, avatar, sendTime, conversationType: convType, isGroupConversation: isGroup, groupName: item.groupName || displayName, announcement: item.announcement || '', introduction: item.introduction || '', members: Array.isArray(item.members) ? item.members : [], isFavorite: statusCode === 3, isMuted: false, clock: formatClock(sendTime) }
}
const setConversations = (list) => { const n = list.map((item, i) => normalizeConv(item, i)).filter(Boolean).sort((a, b) => { const f = Number(b.isFavorite) - Number(a.isFavorite); return f !== 0 ? f : (b.sendTime ?? 0) - (a.sendTime ?? 0) }); conversations.value = n; if (!activeConversationId.value && n.length) activeConversationId.value = n[0].id }
const sortConvs = () => { conversations.value.sort((a, b) => { const f = Number(b.isFavorite) - Number(a.isFavorite); return f !== 0 ? f : (b.sendTime ?? 0) - (a.sendTime ?? 0) }) }
const loadConversations = async ({ force = false } = {}) => { if (!force && conversations.value.length) return; try { const list = await fetchSessionList(); setConversations(Array.isArray(list) ? list : []) } catch (e) { console.error('加载会话失败', e) } }

const filteredConversations = computed(() => { const list = conversations.value; if (!searchTerm.value.trim()) return list; const kw = searchTerm.value.trim().toLowerCase(); return list.filter((c) => (c.displayName || '').toLowerCase().includes(kw) || (c.snippet || '').toLowerCase().includes(kw)) })
const filteredContacts = computed(() => { const list = contacts.value; if (!searchTerm.value.trim()) return list; const kw = searchTerm.value.trim().toLowerCase(); return list.filter((f) => (f.nameEn || '').toLowerCase().includes(kw) || (f.description || '').toLowerCase().includes(kw)) })
const selectedConversation = computed(() => conversations.value.find((c) => c.id === activeConversationId.value) || null)
const selectedThread = computed(() => activeConversationId.value ? (messagesByConversation.value[activeConversationId.value] || []) : [])

const loadMessages = async (convId) => {
  if (!convId || messagesLoading.value || messagesByConversation.value[convId]) return
  messagesLoading.value = true
  try {
    const list = await fetchMessageList(convId); const conv = conversations.value.find((c) => c.id === convId); const cn = conv?.displayName || '对方'
    const msgs = (Array.isArray(list) ? list : []).map((msg, i) => { const dir = Number(msg.direction); const role = dir === 1 ? 'self' : 'contact'; const rid = msg.id || msg.messageId; return { id: rid || msg.sequence || `msg_${i}`, dbId: rid, role, author: role === 'self' ? '我' : cn, text: msg.content || '', messageType: msg.messageType ?? 1, messageFile: msg.messageFile, avatarFullUrl: msg.avatarFullUrl || '', time: formatMsgTime(msg.sendTime), sendTime: msg.sendTime, sequence: msg.sequence, status: msg.status } })
    msgs.sort((a, b) => { if (a.sequence && b.sequence) return a.sequence - b.sequence; if (a.sendTime && b.sendTime) return a.sendTime - b.sendTime; return 0 })
    messagesByConversation.value[convId] = msgs
  } catch (e) { console.error('加载消息失败', e); messagesByConversation.value[convId] = [] } finally { messagesLoading.value = false }
}
const scrollToBottom = () => { nextTick(() => { if (messagesAreaRef.value) messagesAreaRef.value.scrollTop = messagesAreaRef.value.scrollHeight }) }
watch(() => selectedThread.value.length, scrollToBottom)
const selectConversation = async (id) => {
  activeConversationId.value = id; activeNav.value = 'chat'; showEmojiPicker.value = false
  await loadMessages(id); scrollToBottom()
  try { await markAsRead(id); const c = conversations.value.find((x) => x.id === id); if (c) c.unread = 0 } catch (e) {}
}
watch(() => activeConversationId.value, (id) => { if (id) loadMessages(id) })
watch(() => selectedConversation.value, (conv) => { if (conv?.isGroupConversation) { editGroupName.value = conv.groupName || conv.displayName || ''; editGroupIntro.value = conv.introduction || ''; announcementDraft.value = conv.announcement || '' } })

const handleSendMessage = async () => {
  if (!draft.value.trim() || !activeConversationId.value) return
  const convId = activeConversationId.value; const conv = conversations.value.find((c) => c.id === convId); if (!conv) return
  const text = draft.value.trim(); const tempId = `temp_${Date.now()}`
  if (!messagesByConversation.value[convId]) messagesByConversation.value[convId] = []
  messagesByConversation.value[convId].push({ id: tempId, role: 'self', author: '我', text, messageType: 1, messageFile: null, time: formatMsgTime(Date.now()), sendTime: Date.now(), sequence: null, status: 0 })
  const orig = draft.value; draft.value = ''; scrollToBottom()
  try { const resp = await sendMessageAPI({ conversationId: convId, content: text, messageType: 1 }); const idx = messagesByConversation.value[convId].findIndex((m) => m.id === tempId); if (idx !== -1) { const m = messagesByConversation.value[convId][idx]; m.status = 1; if (resp?.id) { m.id = resp.id; m.dbId = resp.id }; if (resp?.sequence) m.sequence = resp.sequence }; conv.snippet = text; conv.content = text; conv.sendTime = Date.now(); conv.clock = formatClock(conv.sendTime); sortConvs()
  } catch (e) { alert(e?.message || '发送失败'); const idx = messagesByConversation.value[convId].findIndex((m) => m.id === tempId); if (idx !== -1) messagesByConversation.value[convId][idx].status = -1; draft.value = orig }
}
const handleFileSelect = async (e) => {
  const file = e.target.files?.[0]; if (!file || !activeConversationId.value) return; e.target.value = ''
  const convId = activeConversationId.value; const conv = conversations.value.find((c) => c.id === convId); if (!conv) return
  const tempId = `temp_f_${Date.now()}`; if (!messagesByConversation.value[convId]) messagesByConversation.value[convId] = []
  messagesByConversation.value[convId].push({ id: tempId, role: 'self', author: '我', text: file.name, messageType: 2, messageFile: null, time: formatMsgTime(Date.now()), sendTime: Date.now(), sequence: null, status: 0 }); scrollToBottom()
  try { const fd = new FormData(); fd.append('file', file); const upRes = await uploadMessageFile(fd); const mf = upRes?.data ?? null; const resp = await sendMessageAPI({ conversationId: convId, content: file.name, messageType: 2, messageFile: mf }); const idx = messagesByConversation.value[convId].findIndex((m) => m.id === tempId); if (idx !== -1) { const m = messagesByConversation.value[convId][idx]; m.status = 1; m.messageFile = resp?.messageFile || mf; if (resp?.id) { m.id = resp.id; m.dbId = resp.id } }; conv.snippet = '[图片]'; conv.sendTime = Date.now(); conv.clock = formatClock(conv.sendTime); sortConvs()
  } catch (e) { alert(e?.message || '文件发送失败'); const idx = messagesByConversation.value[convId].findIndex((m) => m.id === tempId); if (idx !== -1) messagesByConversation.value[convId][idx].status = -1 }
}

const loadChatEmojiPacks = async () => { try { chatEmojiPacks.value = await fetchMyEmojiPackList(); if (chatEmojiPacks.value.length && !chatSelectedPackId.value) { const def = chatEmojiPacks.value.find((p) => Number(p?.type) === 1); chatSelectedPackId.value = def?.id ?? chatEmojiPacks.value[0]?.id; if (chatSelectedPackId.value) await loadChatEmojiItems(chatSelectedPackId.value) } } catch (e) {} }
const loadChatEmojiItems = async (packId) => { if (!packId || chatEmojiItemsByPackId.value[packId]) return; try { const items = await fetchEmojiItems(packId); chatEmojiItemsByPackId.value[packId] = items } catch (e) {} }
const selectChatEmojiPack = async (packId) => { chatSelectedPackId.value = packId; await loadChatEmojiItems(packId) }
const chatSelectedEmojiItems = computed(() => chatSelectedPackId.value ? (chatEmojiItemsByPackId.value[chatSelectedPackId.value] || []) : [])
const handlePickEmoji = (item) => { if (item.type === 1 && item.unicodeVal) { draft.value += item.unicodeVal; showEmojiPicker.value = false; return }; const fi = item.file || item.emojiItemFile; if (fi) { handleSendEmojiFile(fi); showEmojiPicker.value = false } }
const handleSendEmojiFile = async (fileInfo) => {
  if (!activeConversationId.value) return; const convId = activeConversationId.value; const conv = conversations.value.find((c) => c.id === convId); if (!conv) return
  const tempId = `temp_e_${Date.now()}`; if (!messagesByConversation.value[convId]) messagesByConversation.value[convId] = []
  messagesByConversation.value[convId].push({ id: tempId, role: 'self', author: '我', text: '[表情]', messageType: 2, messageFile: fileInfo, time: formatMsgTime(Date.now()), sendTime: Date.now(), sequence: null, status: 0 }); scrollToBottom()
  try { const resp = await sendMessageAPI({ conversationId: convId, content: fileInfo.fileName || '[表情]', messageType: 2, messageFile: fileInfo }); const idx = messagesByConversation.value[convId].findIndex((m) => m.id === tempId); if (idx !== -1) { const m = messagesByConversation.value[convId][idx]; m.status = 1; if (resp?.id) { m.id = resp.id; m.dbId = resp.id } }; conv.snippet = '[表情]'; conv.sendTime = Date.now(); conv.clock = formatClock(conv.sendTime); sortConvs()
  } catch (e) { const idx = messagesByConversation.value[convId].findIndex((m) => m.id === tempId); if (idx !== -1) messagesByConversation.value[convId][idx].status = -1 }
}
watch(() => showEmojiPicker.value, (v) => { if (v) loadChatEmojiPacks() })

const showNotification = (message) => {
  if (Number(currentUser.notificationEnabled) === 1) return
  const convId = message.conversationId || message.sessionId || message.from || message.senderId; if (!convId) return
  if (activeConversationId.value && String(activeConversationId.value) === String(convId)) return
  const conv = conversations.value.find((c) => String(c.id) === String(convId))
  notification.senderName = conv?.displayName || message.senderNickname || '新消息'
  notification.text = message.text || message.content || '[收到一条消息]'
  notification.conversationId = convId; notification.visible = true
  if (notifTimer) clearTimeout(notifTimer); notifTimer = setTimeout(() => { notification.visible = false }, 5000)
}
const handleNotifClick = () => { notification.visible = false; if (notification.conversationId) selectConversation(Number(notification.conversationId) || notification.conversationId) }

const handleReceivedMessage = (message) => {
  const convId = message.conversationId || message.sessionId || message.to || message.from || message.senderId; if (!convId) return
  const senderId = message.from || message.senderId; const isFromMe = String(senderId) === String(currentUser.id)
  if (!isFromMe) showNotification(message)
  loadConversations({ force: true }).then(() => {
    if (!messagesByConversation.value[convId]) messagesByConversation.value[convId] = []
    const conv = conversations.value.find((c) => String(c.id) === String(convId)); const cn = conv?.displayName || '对方'
    const role = isFromMe ? 'self' : 'contact'; const text = message.text || message.content || ''; const time = message.sendTime || Date.now()
    const existing = messagesByConversation.value[convId].find((m) => { if (message.sequence && m.sequence) return m.sequence === message.sequence; if (message.id && m.id) return String(m.id) === String(message.id); if (isFromMe && m.role === 'self' && m.text === text && Math.abs((m.sendTime || 0) - time) < 5000) return true; return false })
    if (existing) { if (message.status !== undefined) existing.status = message.status; return }
    messagesByConversation.value[convId].push({ id: message.id || message.messageId || message.sequence || `msg_${Date.now()}`, dbId: message.id || message.messageId, role, author: isFromMe ? '我' : cn, text, messageType: message.messageType ?? 1, messageFile: message.messageFile, avatarFullUrl: message.avatarFullUrl || '', time: formatMsgTime(time), sendTime: time, sequence: message.sequence, status: message.status !== undefined ? message.status : 1 })
    messagesByConversation.value[convId].sort((a, b) => { if (a.sequence && b.sequence) return a.sequence - b.sequence; if (a.sendTime && b.sendTime) return a.sendTime - b.sendTime; return 0 })
    scrollToBottom()
    if (!isFromMe && activeConversationId.value && (activeConversationId.value === Number(convId) || String(activeConversationId.value) === String(convId))) { markAsRead(convId) }
  })
}
const { isConnected, connect, disconnect } = useChatWebSocket({ currentUserId: computed(() => currentUser.id), conversations, activeConversationId, messagesByConversation, onMessageReceived: handleReceivedMessage })

const loadFriends = async () => { try { contacts.value = await fetchNormalizedFriends() } catch (e) {} }
const loadGroups = async () => { try { groups.value = await fetchNormalizedGroups() } catch (e) {} }
const loadFriendReqs = async () => { try { const data = await fetchFriendRequests(); const list = Array.isArray(data) ? data : Array.isArray(data?.friendRequestList) ? data.friendRequestList : []; const pc = typeof data?.pendingCount === 'number' ? data.pendingCount : list.filter((i) => Number(i?.requestStatus) === 0 && Number(i?.applyDirection) !== 1).length; const inc = []; const out = []; list.forEach((item, i) => { if (!item) return; const dir = Number(item.applyDirection); const rec = { id: item.id ?? `${dir}-${item.userId}-${i}`, userId: item.userId, nickname: item.nickname ?? '', applyMessage: item.applyMessage ?? '', avatar: item.avatarFullUrl ?? '', requestStatus: Number(item.requestStatus) ?? 0 }; if (dir === 1) out.push(rec); else inc.push(rec) }); friendRequests.incoming = inc; friendRequests.outgoing = out; friendRequests.pendingCount = pc } catch (e) {} }
const handleApproveReq = async (req) => { let fid = req.userId; const n = Number(fid); if (!Number.isNaN(n)) fid = n; try { await agreeFriendRequest({ friendId: fid, remark: req.nickname ?? '' }); alert('已同意'); loadFriendReqs(); loadFriends() } catch (e) { alert(e?.message || '操作失败') } }
const handleRejectReq = async (req) => { let fid = req.userId; const n = Number(fid); if (!Number.isNaN(n)) fid = n; try { await rejectFriendRequest(fid); alert('已拒绝'); loadFriendReqs() } catch (e) { alert(e?.message || '操作失败') } }
const handleFriendClick = async (f) => {
  const fid = f.userId ?? f.id
  if (!fid) return
  activeFriendId.value = fid
  showFriendDetail.value = true
  friendDetail.value = null
  friendDetailLoading.value = true
  try {
    friendDetail.value = await fetchFriendDetail(fid)
  } catch (e) {
    friendDetail.value = null
  } finally {
    friendDetailLoading.value = false
  }
}

const closeFriendDetail = () => {
  showFriendDetail.value = false
  friendDetail.value = null
  friendDetailLoading.value = false
  friendStartingConversation.value = false
  friendDeleting.value = false
  isEditingRemark.value = false
  editRemarkValue.value = ''
}

const startEditRemark = () => {
  editRemarkValue.value = friendDetail.value?.remark || selectedFriend.value?.remark || ''
  isEditingRemark.value = true
}

const handleUpdateRemark = async () => {
  const fid = activeFriendId.value
  if (!fid || friendUpdatingRemark.value) return
  friendUpdatingRemark.value = true
  try {
    await updateFriendRemark(fid, editRemarkValue.value.trim())
    if (friendDetail.value) {
      friendDetail.value.remark = editRemarkValue.value.trim()
    }
    isEditingRemark.value = false
    await loadFriends()
  } catch (e) {
    alert(e?.message || '更新失败')
  } finally {
    friendUpdatingRemark.value = false
  }
}

const handleSendMessageToFriend = async () => {
  const fid = activeFriendId.value
  if (!fid || friendStartingConversation.value) return
  friendStartingConversation.value = true
  try {
    const cid = await restoreConversationByFriend(fid)
    await loadConversations({ force: true })
    const nid = Number(cid)
    await selectConversation(Number.isNaN(nid) ? cid : nid)
    closeFriendDetail()
    activeNav.value = 'chat'
  } catch (e) {
    alert(e?.message || '发起会话失败')
  } finally {
    friendStartingConversation.value = false
  }
}

const handleDeleteFriend = async () => {
  const fid = activeFriendId.value
  if (!fid || friendDeleting.value) return
  if (!confirm('确定要删除这个好友吗？此操作将移除你们的好友关系')) return
  friendDeleting.value = true
  try {
    await deleteFriend(fid)
    alert('好友已删除')
    closeFriendDetail()
    await loadFriends()
    await loadFriendReqs()
  } catch (e) {
    alert(e?.message || '删除失败')
  } finally {
    friendDeleting.value = false
  }
}
const handleGroupClick = async (g) => { showGroupDetail.value = true; groupDetailData.value = { ...g, loading: true }; try { const detail = await fetchGroupDetail(g.id); groupDetailData.value = { ...g, ...detail } } catch (e) { console.error(e) } }
const handleSendGroupMsgFromContacts = async () => { if (!groupDetailData.value) return; const gid = groupDetailData.value.id; try { const sid = await restoreConversationByGroup(gid); await loadConversations({ force: true }); const nid = Number(sid); await selectConversation(Number.isNaN(nid) ? sid : nid); showGroupDetail.value = false } catch (e) { alert(e?.message || '无法发起群聊') } }
const handleSearchUser = async () => {
  const email = addFriendEmail.value.trim()
  if (!email) return
  searchingUser.value = true
  searchError.value = ''
  searchUserResult.value = null
  searchResults.value = []
  try {
    const { data } = await apiClient.post('/user/getUserInfoByEmail', { param: email })
    const list = Array.isArray(data) ? data : (data ? [data] : [])
    if (list.length > 0) {
      searchResults.value = list
    } else {
      searchError.value = '未找到该用户'
    }
  } catch (e) {
    searchError.value = e?.message || '搜索失败'
  } finally {
    searchingUser.value = false
  }
}

const handleSelectSearchResult = (user) => {
  searchUserResult.value = user
  addFriendMsg.value = `你好，我是${currentUser.nickname}`
  addFriendRemark.value = user.nickname || ''
}

const handleAddFriendSubmit = async () => {
  if (!searchUserResult.value || addingFriend.value) return
  addingFriend.value = true
  try {
    await apiClient.post('/friend/addFriendRequest', {
      receiverId: searchUserResult.value.id,
      applyMessage: addFriendMsg.value.trim() || '请求添加好友',
      remark: addFriendRemark.value.trim() || searchUserResult.value.nickname
    })
    alert('好友请求已发送')
    showAddFriend.value = false
    addFriendEmail.value = ''
    addFriendMsg.value = ''
    addFriendRemark.value = ''
    searchUserResult.value = null
    loadFriendReqs()
  } catch (e) {
    alert(e?.message || '发送失败')
  } finally {
    addingFriend.value = false
  }
}
const handleStartGroup = async () => { if (!contacts.value.length) await loadFriends(); if (!contacts.value.length) { alert('暂无好友可选'); return }; groupName.value = ''; selectedMembers.value = []; showCreateGroup.value = true }
const handleCreateGroupConfirm = async () => { if (!groupName.value.trim()) { alert('请输入群名称'); return }; if (!selectedMembers.value.length) { alert('请选择成员'); return }; creatingGroup.value = true; try { await createGroup({ groupName: groupName.value.trim(), memberIds: selectedMembers.value }); alert('群聊已创建'); showCreateGroup.value = false; await loadConversations({ force: true }); loadGroups() } catch (e) { alert(e?.message || '创建失败') } finally { creatingGroup.value = false } }

const groupInviteCandidates = computed(() => { const conv = selectedConversation.value; if (!conv?.isGroupConversation) return []; const memberIds = new Set((conv.members || []).map((m) => m?.id ?? m?.userId).filter(Boolean)); return contacts.value.filter((f) => !memberIds.has(f.id)).map((f) => ({ id: f.id, displayName: f.nameEn || f.nickname || `好友 #${f.id}` })) })
const canInvite = computed(() => groupInviteCandidates.value.length > 0)
const handleInviteConfirm = async () => { if (!inviteSelectedIds.value.length) { showGroupInvite.value = false; return }; const conv = selectedConversation.value; if (!conv) return; const gid = conv.relationId ?? conv.id; try { await inviteMembers(gid, inviteSelectedIds.value); alert('已发送邀请'); showGroupInvite.value = false; inviteSelectedIds.value = []; await loadConversations({ force: true }) } catch (e) { alert(e?.message || '邀请失败') } }
const handleUpdateGroupName = async () => { const conv = selectedConversation.value; if (!conv?.isGroupConversation) return; const name = editGroupName.value.trim(); if (!name || name === (conv.groupName || conv.displayName || '').trim()) return; conv.groupName = name; conv.displayName = name; conv.nameEn = name; sortConvs(); try { await editGroup({ groupId: conv.relationId ?? conv.id, groupName: name, introduction: conv.introduction || '', announcement: conv.announcement || '' }) } catch (e) { alert(e?.message || '更新失败') } }
const handleUpdateGroupIntro = async () => { const conv = selectedConversation.value; if (!conv?.isGroupConversation) return; const intro = editGroupIntro.value.trim(); if (intro === (conv.introduction || '').trim()) return; conv.introduction = intro; try { await editGroup({ groupId: conv.relationId ?? conv.id, groupName: conv.groupName || conv.displayName || '', introduction: intro, announcement: conv.announcement || '' }) } catch (e) { alert(e?.message || '更新失败') } }
const handleSaveAnnouncement = async () => { const conv = selectedConversation.value; if (!conv?.isGroupConversation) return; conv.announcement = announcementDraft.value.trim(); try { await editGroup({ groupId: conv.relationId ?? conv.id, groupName: conv.groupName || conv.displayName || '', introduction: conv.introduction || '', announcement: conv.announcement }); showAnnouncementModal.value = false } catch (e) { alert(e?.message || '更新失败') } }
const handleRemoveMember = async (member) => { const conv = selectedConversation.value; if (!conv?.isGroupConversation) return; const mid = member?.userId ?? member?.id; if (!mid) return; try { await removeGroupMembers(conv.relationId ?? conv.id, [mid]); const detail = await fetchGroupDetail(conv.relationId ?? conv.id); if (detail?.members) conv.members = detail.members; alert('已移除') } catch (e) { alert(e?.message || '移除失败') } }
const handleDissolveGroup = async () => { const conv = selectedConversation.value; if (!conv?.isGroupConversation) return; if (!confirm('确定解散群聊？')) return; try { await dissolveGroup(conv.relationId ?? conv.id); alert('群聊已解散'); showSettingsDrawer.value = false; await loadConversations({ force: true }); if (activeConversationId.value === conv.id) activeConversationId.value = conversations.value[0]?.id ?? null } catch (e) { alert(e?.message || '解散失败') } }
const handleLeaveGroup = async () => { const conv = selectedConversation.value; if (!conv) return; await deleteConvById(conv.id); showSettingsDrawer.value = false }

const ctxMenu = reactive({ visible: false, x: 0, y: 0, target: null })
const ctxMenuRef = ref(null)
const openCtxMenu = (conv, e) => { ctxMenu.visible = true; ctxMenu.x = e.clientX; ctxMenu.y = e.clientY; ctxMenu.target = conv }
const closeCtxMenu = () => { ctxMenu.visible = false; ctxMenu.target = null }
const handleCtxFavorite = async () => { if (!ctxMenu.target) { closeCtxMenu(); return }; const next = !ctxMenu.target.isFavorite; try { await toggleFavoriteSession(ctxMenu.target.id, next); ctxMenu.target.isFavorite = next; ctxMenu.target.statusCode = next ? 3 : 1; sortConvs(); await loadConversations({ force: true }) } catch (e) { alert(e?.message || '操作失败') }; closeCtxMenu() }
const handleCtxDelete = async () => { if (!ctxMenu.target) { closeCtxMenu(); return }; await deleteConvById(ctxMenu.target.id); closeCtxMenu() }
const handleToggleFavorite = async (next) => { const conv = selectedConversation.value; if (!conv) return; try { await toggleFavoriteSession(conv.id, next); const t = conversations.value.find((c) => c.id === conv.id); if (t) { t.isFavorite = next; t.statusCode = next ? 3 : 1 }; sortConvs(); await loadConversations({ force: true }) } catch (e) { alert(e?.message || '操作失败') } }
const handleToggleMute = (next) => { const conv = selectedConversation.value; if (!conv) return; const t = conversations.value.find((c) => c.id === conv.id); if (t) t.isMuted = next; alert(next ? '已开启免打扰' : '已关闭免打扰') }
const deleteConvById = async (id) => { try { await deleteSession(id); conversations.value = conversations.value.filter((c) => c.id !== id); if (activeConversationId.value === id) activeConversationId.value = conversations.value[0]?.id ?? null; alert('会话已删除') } catch (e) { alert(e?.message || '删除失败') } }
const handleDeleteConversation = async () => { const conv = selectedConversation.value; if (!conv) return; if (!confirm('确定删除此会话？')) return; await deleteConvById(conv.id); showSettingsDrawer.value = false }

const msgCtxMenu = reactive({ visible: false, x: 0, y: 0, msg: null })
const openMsgCtxMenu = (e, msg) => { msgCtxMenu.visible = true; msgCtxMenu.x = e.clientX; msgCtxMenu.y = e.clientY; msgCtxMenu.msg = msg }
const closeMsgCtxMenu = () => { msgCtxMenu.visible = false; msgCtxMenu.msg = null }
const handleCollectMessage = async () => { const msg = msgCtxMenu.msg; if (!msg || !selectedConversation.value) { closeMsgCtxMenu(); return }; const mId = msg.dbId || msg.id; if (!mId || String(mId).startsWith('temp_') || String(mId).startsWith('msg_')) { alert('消息ID无效'); closeMsgCtxMenu(); return }; try { await collectFromMessage({ conversationId: selectedConversation.value.id, messageId: mId }); alert('已收藏') } catch (e) { alert(e?.message || '收藏失败') }; closeMsgCtxMenu() }
const handleAddMsgEmoji = async () => { const msg = msgCtxMenu.msg; if (!msg?.messageFile) { closeMsgCtxMenu(); return }; try { const fi = msg.messageFile; if (fi?.sourceType === 'EMOJI_ITEM_STATIC' || fi?.sourceType === 'EMOJI_ITEM_GIF') { await collectEmojiItem(fi.sourceId) } else { await addEmojiFromMessageFile({ file: { sourceType: fi?.sourceType, sourceId: fi?.sourceId, fileType: fi?.fileType, fileName: fi?.fileName, fileSize: fi?.fileSize, filePath: fi?.filePath, fileDesc: fi?.fileDesc } }) }; alert('已添加到表情') } catch (e) { alert(e?.message || '添加失败') }; closeMsgCtxMenu() }

const loadDynamicList = async () => { try { const data = await fetchSocialFeedList({ page: 1, size: 50 }); const list = Array.isArray(data?.feedList) ? data.feedList : Array.isArray(data) ? data : []; dynamicList.value = list.map((f) => ({ ...f, _showComments: false, _commentDraft: '', isMine: String(f.userId) === String(currentUser.id) })) } catch (e) { console.error('加载动态失败', e) } }
const handleToggleLike = async (feed) => { try { if (feed.isLiked) { await unlikeSocialFeed(feed.id); feed.isLiked = false; feed.likeCount = Math.max(0, (feed.likeCount || 1) - 1) } else { await likeSocialFeed(feed.id); feed.isLiked = true; feed.likeCount = (feed.likeCount || 0) + 1 } } catch (e) { alert(e?.message || '操作失败') } }
const handleComment = async (feed) => { const text = (feed._commentDraft || '').trim(); if (!text) return; try { await commentSocialFeed({ feedId: feed.id, content: text }); feed._commentDraft = ''; await loadDynamicList() } catch (e) { alert(e?.message || '评论失败') } }
const handleDeleteComment = async (feed, commentId) => { try { await deleteSocialFeedComment(commentId); await loadDynamicList() } catch (e) { alert(e?.message || '删除失败') } }
const handleDeleteFeed = async (feedId) => { if (!confirm('确定删除此动态？')) return; try { await deleteSocialFeed(feedId); if (String(activeFeedId.value) === String(feedId)) { activeFeedId.value = null; activeFeedDetail.value = null }; await loadDynamicList() } catch (e) { alert(e?.message || '删除失败') } }
const selectFeed = async (feedId) => { activeFeedId.value = feedId; feedDetailCommentDraft.value = ''; try { const detail = await fetchSocialFeedDetail(feedId); activeFeedDetail.value = detail } catch (e) { console.error('加载动态详情失败', e); activeFeedDetail.value = null } }
const refreshFeedDetail = async () => { if (!activeFeedId.value) return; try { const detail = await fetchSocialFeedDetail(activeFeedId.value); activeFeedDetail.value = detail } catch (e) { activeFeedDetail.value = null } }
const handleDetailToggleLike = async () => { if (!activeFeedDetail.value) return; try { if (activeFeedDetail.value.isLiked) { await unlikeSocialFeed(activeFeedDetail.value.id); activeFeedDetail.value.isLiked = false; activeFeedDetail.value.likeCount = Math.max(0, (activeFeedDetail.value.likeCount || 1) - 1) } else { await likeSocialFeed(activeFeedDetail.value.id); activeFeedDetail.value.isLiked = true; activeFeedDetail.value.likeCount = (activeFeedDetail.value.likeCount || 0) + 1 }; await loadDynamicList() } catch (e) { alert(e?.message || '操作失败') } }
const handleDetailComment = async () => { const text = feedDetailCommentDraft.value.trim(); if (!text || !activeFeedDetail.value) return; try { await commentSocialFeed({ feedId: activeFeedDetail.value.id, content: text }); feedDetailCommentDraft.value = ''; await refreshFeedDetail(); await loadDynamicList() } catch (e) { alert(e?.message || '评论失败') } }
const handleDetailDeleteComment = async (commentId) => { try { await deleteSocialFeedComment(commentId); await refreshFeedDetail(); await loadDynamicList() } catch (e) { alert(e?.message || '删除失败') } }
const handleDeleteFeedFromDetail = async () => { if (!activeFeedDetail.value) return; const feedId = activeFeedDetail.value.id; if (!confirm('确定删除此动态？')) return; try { await deleteSocialFeed(feedId); activeFeedId.value = null; activeFeedDetail.value = null; await loadDynamicList() } catch (e) { alert(e?.message || '删除失败') } }
const openPublishFeed = () => { feedDraft.value = ''; feedFiles.value = []; showPublishFeed.value = true }
const handleFeedFileSelect = (e) => { feedFiles.value = Array.from(e.target.files || []); e.target.value = '' }
const handlePublishFeed = async () => { if (!feedDraft.value.trim()) { alert('请输入内容'); return }; publishingFeed.value = true; try { let files = []; if (feedFiles.value.length) { files = await uploadSocialFeedFiles(feedFiles.value) }; await publishSocialFeed({ content: feedDraft.value.trim(), files: Array.isArray(files) ? files : [] }); alert('发布成功'); showPublishFeed.value = false; await loadDynamicList() } catch (e) { alert(e?.message || '发布失败') } finally { publishingFeed.value = false } }

const loadFavorites = async () => { try { const { data } = await fetchFavoriteList(); favoriteList.value = Array.isArray(data) ? data : [] } catch (e) {} }
const selectFavorite = (fav) => {
  activeFavoriteId.value = fav.id
  activeFavoriteDetail.value = fav
}
const handleDeleteFavorite = async (id) => {
  try {
    await deleteFavorite(id)
    favoriteList.value = favoriteList.value.filter((f) => f.id !== id)
    if (activeFavoriteId.value === id) {
      activeFavoriteId.value = null
      activeFavoriteDetail.value = null
    }
  } catch (e) {
    alert(e?.message || '删除失败')
  }
}

const loadEmojiPacks = async () => { try { emojiPacks.value = await fetchMyEmojiPackList(); if (emojiPacks.value.length && !selectedEmojiPackId.value) { selectedEmojiPackId.value = emojiPacks.value[0]?.id; if (selectedEmojiPackId.value) await loadEmojiItemsForPack(selectedEmojiPackId.value) } } catch (e) {} }
const loadEmojiItemsForPack = async (packId) => { if (!packId || emojiItemsByPackId.value[packId]) return; try { const items = await fetchEmojiItems(packId); emojiItemsByPackId.value[packId] = items } catch (e) {} }
const selectEmojiPack = async (packId) => { selectedEmojiPackId.value = packId; await loadEmojiItemsForPack(packId) }
const selectedEmojiItems = computed(() => selectedEmojiPackId.value ? (emojiItemsByPackId.value[selectedEmojiPackId.value] || []) : [])
const handleUnbindPack = async (packId) => { if (!confirm('确定移除此表情包？')) return; try { await unbindEmojiPack(packId); emojiPacks.value = emojiPacks.value.filter((p) => p.id !== packId); if (selectedEmojiPackId.value === packId) { selectedEmojiPackId.value = emojiPacks.value[0]?.id ?? null; if (selectedEmojiPackId.value) await loadEmojiItemsForPack(selectedEmojiPackId.value) }; alert('已移除') } catch (e) { alert(e?.message || '移除失败') } }
const handleDeleteEmojiItem = async (item) => { if (!isSelectedEmojiPackCustom.value) return; if (!confirm('确定删除此表情？')) return; try { await deleteCustomizeEmojiItem(item.id); const packId = selectedEmojiPackId.value; if (packId && emojiItemsByPackId.value[packId]) { emojiItemsByPackId.value[packId] = emojiItemsByPackId.value[packId].filter((i) => i.id !== item.id) }; alert('已删除') } catch (e) { alert(e?.message || '删除失败') } }

const emojiMgrTotalPages = computed(() => { const t = Number(emojiMgrTotal.value); const s = Number(emojiMgrSize.value); if (!Number.isFinite(t) || !Number.isFinite(s) || s <= 0) return 1; return Math.max(1, Math.ceil(t / s)) })
const openEmojiManager = () => { showEmojiManager.value = true; emojiMgrTab.value = 'official'; emojiMgrKeyword.value = ''; emojiMgrPage.value = 1; emojiMgrPacks.value = []; emojiMgrTotal.value = 0; emojiMgrViewMode.value = 'list'; emojiMgrSelectedPack.value = null; emojiMgrItems.value = []; emojiMgrBindingId.value = null; emojiMgrUnbindingId.value = null; emojiMgrDeletingId.value = null; emojiMgrMyPacks.value = []; loadOfficialPacks() }
const loadOfficialPacks = async () => { emojiMgrLoading.value = true; try { const data = await fetchEmojiPackList({ page: emojiMgrPage.value, size: emojiMgrSize.value, name: emojiMgrKeyword.value.trim() }); emojiMgrTotal.value = Number(data?.total) || 0; emojiMgrPacks.value = Array.isArray(data?.records) ? data.records : [] } catch (e) { emojiMgrPacks.value = []; emojiMgrTotal.value = 0 } finally { emojiMgrLoading.value = false } }
const loadEmojiMgrMyPacks = async () => { emojiMgrMyLoading.value = true; try { const list = await fetchMyEmojiPackList(); emojiMgrMyPacks.value = (Array.isArray(list) ? list : []).filter((p) => Number(p?.type) !== 1) } catch (e) { emojiMgrMyPacks.value = [] } finally { emojiMgrMyLoading.value = false } }
const switchEmojiMgrTab = async (tab) => { if (emojiMgrTab.value === tab) return; emojiMgrTab.value = tab; emojiMgrViewMode.value = 'list'; emojiMgrSelectedPack.value = null; emojiMgrItems.value = []; if (tab === 'official') { await loadOfficialPacks() } else { await loadEmojiMgrMyPacks() } }
const handleEmojiMgrSearch = async () => { emojiMgrPage.value = 1; await loadOfficialPacks() }
const emojiMgrPrevPage = async () => { if (emojiMgrPage.value <= 1) return; emojiMgrPage.value--; await loadOfficialPacks() }
const emojiMgrNextPage = async () => { if (emojiMgrPage.value >= emojiMgrTotalPages.value) return; emojiMgrPage.value++; await loadOfficialPacks() }
const handleEmojiMgrBind = async (pack) => { if (!pack || pack.bound || emojiMgrBindingId.value) return; emojiMgrBindingId.value = pack.id; try { await bindEmojiPack(pack.id); pack.bound = true; alert('添加成功') } catch (e) { alert(e?.message || '添加失败') } finally { emojiMgrBindingId.value = null } }
const handleEmojiMgrUnbind = async (pack) => { if (!pack || !pack.id || Number(pack.type) === 2 || emojiMgrUnbindingId.value) return; if (!confirm(`确认移除"${pack.name || '表情包'}"吗？`)) return; emojiMgrUnbindingId.value = pack.id; try { await unbindEmojiPack(pack.id); emojiMgrMyPacks.value = emojiMgrMyPacks.value.filter((p) => p.id !== pack.id); const existed = emojiMgrPacks.value.find((p) => p.id === pack.id); if (existed) existed.bound = false; if (emojiMgrSelectedPack.value?.id === pack.id) { emojiMgrViewMode.value = 'list'; emojiMgrSelectedPack.value = null; emojiMgrItems.value = [] }; alert('移除成功') } catch (e) { alert(e?.message || '移除失败') } finally { emojiMgrUnbindingId.value = null } }
const openEmojiMgrPack = async (pack) => { if (!pack) return; emojiMgrSelectedPack.value = pack; emojiMgrViewMode.value = 'detail'; emojiMgrItemsLoading.value = true; emojiMgrItems.value = []; try { const list = await fetchEmojiItems(pack.id); emojiMgrItems.value = Array.isArray(list) ? list : [] } catch (e) { emojiMgrItems.value = [] } finally { emojiMgrItemsLoading.value = false } }
const handleEmojiMgrDeleteItem = async (item) => { if (!item || emojiMgrDeletingId.value) return; if (Number(emojiMgrSelectedPack.value?.type) !== 2) return; if (!confirm('确认删除该自定义表情吗？')) return; emojiMgrDeletingId.value = item.id; try { await deleteCustomizeEmojiItem(item.id); emojiMgrItems.value = emojiMgrItems.value.filter((i) => i.id !== item.id); alert('删除成功') } catch (e) { alert(e?.message || '删除失败') } finally { emojiMgrDeletingId.value = null } }
const emojiMgrBackToList = () => { emojiMgrViewMode.value = 'list'; emojiMgrSelectedPack.value = null; emojiMgrItems.value = [] }
const closeEmojiManager = () => { showEmojiManager.value = false; loadEmojiPacks() }

const openProfileModal = () => { showUserMenu.value = false; profileForm.nickname = currentUser.nickname; profileForm.signature = currentUser.signature; profileForm.gender = normalizeGender(currentUser.gender); showProfileModal.value = true }
const normalizeGender = (v) => { if (!v) return ''; const s = String(v).trim().toLowerCase(); if (s === '1' || s === 'male' || s === '男') return 'male'; if (s === '2' || s === 'female' || s === '女') return 'female'; return '' }
const handleProfileSave = async () => { updatingProfile.value = true; const gv = profileForm.gender === 'male' ? 1 : profileForm.gender === 'female' ? 2 : 0; try { await updateProfile({ nickname: profileForm.nickname, signature: profileForm.signature, gender: gv }); alert('已保存'); await getUserInfo(); showProfileModal.value = false } catch (e) { alert(e?.message || '保存失败') } finally { updatingProfile.value = false } }
const handleAvatarChange = async (e) => { const file = e.target.files?.[0]; if (!file) return; const fd = new FormData(); fd.append('file', file); try { const { data } = await uploadUserAvatar(fd); const url = typeof data === 'string' ? data : data?.url ?? data?.avatarUrl ?? ''; if (url) { currentUser.avatarUrl = url; currentUser.avatarFullUrl = url }; alert('头像已更新'); await getUserInfo() } catch (e) { alert(e?.message || '上传失败') } }

const openResetPwModal = () => { showUserMenu.value = false; resetPwCode.value = ''; resetPwNew.value = ''; resetPwConfirm.value = ''; showResetPwModal.value = true }
const handleSendResetCode = async () => { if (sendingResetCode.value) return; try { sendingResetCode.value = true; await requestPasswordResetCode(currentUser.email); alert('验证码已发送'); resetCodeCountdown.value = 60; resetCodeTimer = setInterval(() => { if (resetCodeCountdown.value <= 1) { resetCodeCountdown.value = 0; clearInterval(resetCodeTimer); resetCodeTimer = null } else resetCodeCountdown.value-- }, 1000) } catch (e) { alert(e?.message || '发送失败') } finally { sendingResetCode.value = false } }
const handleResetPw = async () => { if (resettingPw.value) return; if (!resetPwCode.value) { alert('请输入验证码'); return }; if (!resetPwNew.value) { alert('请输入新密码'); return }; if (resetPwNew.value !== resetPwConfirm.value) { alert('两次密码不一致'); return }; try { resettingPw.value = true; await recoverPassword({ email: currentUser.email, code: resetPwCode.value, password: resetPwNew.value, passwordConfirm: resetPwConfirm.value }); alert('密码已重置'); showResetPwModal.value = false } catch (e) { alert(e?.message || '重置失败') } finally { resettingPw.value = false } }

const openNotifSettings = () => { showUserMenu.value = false; showNotifModal.value = true }
const handleToggleNotif = async () => { const next = Number(currentUser.notificationEnabled) === 2 ? 1 : 2; try { await updateNotificationEnabled(next); currentUser.notificationEnabled = next; alert('设置已保存') } catch (e) { alert(e?.message || '保存失败'); await getUserInfo() } }

const switchNav = async (id) => {
  activeNav.value = id; showEmojiPicker.value = false
  if (id === 'chat') await loadConversations()
  if (id === 'contacts') { await loadFriends(); loadFriendReqs(); loadGroups() }
  if (id === 'dynamic') await loadDynamicList()
  if (id === 'favorites') await loadFavorites()
  if (id === 'emoji') await loadEmojiPacks()
}

const handleLogout = async () => { showUserMenu.value = false; try { await logoutApi() } catch (e) {}; authStore.clearToken(); router.push({ name: 'Login' }) }

const getUserInfo = async () => { try { const data = await fetchUserInfo(); if (data) { currentUser.id = data.id ?? null; currentUser.email = data.email ?? ''; currentUser.nickname = data.nickname ?? ''; currentUser.avatarUrl = data.avatarUrl ?? data.avatarFullUrl ?? ''; currentUser.avatarFullUrl = data.avatarFullUrl ?? currentUser.avatarUrl; currentUser.notificationEnabled = data.notificationEnabled ?? 2; currentUser.signature = data.signature ?? ''; currentUser.gender = normalizeGender(data.gender ?? data.genderDesc) } } catch (e) {} }

const isResizing = ref(false); const startX = ref(0); const startW = ref(300)
const onResizeStart = (e) => { isResizing.value = true; startX.value = e.clientX; startW.value = sidebarWidth.value; window.addEventListener('mousemove', onResizeMove); window.addEventListener('mouseup', onResizeEnd) }
const onResizeMove = (e) => { if (!isResizing.value) return; sidebarWidth.value = Math.min(480, Math.max(220, startW.value + e.clientX - startX.value)) }
const onResizeEnd = () => { isResizing.value = false; window.removeEventListener('mousemove', onResizeMove); window.removeEventListener('mouseup', onResizeEnd) }

const handleGlobalClick = (e) => { if (ctxMenu.visible && ctxMenuRef.value && !ctxMenuRef.value.contains(e.target)) closeCtxMenu(); if (msgCtxMenu.visible) closeMsgCtxMenu() }

onMounted(async () => {
  window.addEventListener('click', handleGlobalClick)
  await getUserInfo(); await loadConversations(); loadFriends(); loadFriendReqs(); loadGroups()
  if (currentUser.id) { try { await connect() } catch (e) { console.error('WebSocket连接失败', e) } }
})
onBeforeUnmount(() => { window.removeEventListener('click', handleGlobalClick); window.removeEventListener('mousemove', onResizeMove); window.removeEventListener('mouseup', onResizeEnd); disconnect(); if (resetCodeTimer) clearInterval(resetCodeTimer); if (notifTimer) clearTimeout(notifTimer) })
</script>

<style scoped>
@import './chat-view.css';
</style>
