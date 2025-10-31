<template>
  <div class="brand-placeholder">
    <div class="logo">
      <span class="logo__ring">
        <span class="logo__bubble">
          <span class="logo__spark"></span>
        </span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.brand-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(244, 249, 246, 0.85), rgba(232, 244, 238, 0.65));
}

.logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 44px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 34px 68px rgba(24, 68, 48, 0.16);
}

.logo__ring {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 128px;
  height: 128px;
  border-radius: 40px;
  background: linear-gradient(135deg, rgba(52, 204, 122, 0.2), rgba(16, 170, 157, 0.32));
  box-shadow:
    0 18px 36px rgba(21, 87, 63, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.logo__ring::after {
  content: '';
  position: absolute;
  inset: 14px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.94);
}

.logo__bubble {
  position: relative;
  width: 72px;
  height: 52px;
  border-radius: 18px;
  background: linear-gradient(135deg, #33c77a, #15b6a2);
  box-shadow:
    0 18px 36px rgba(18, 102, 80, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.logo__bubble::after {
  content: '';
  position: absolute;
  bottom: -11px;
  right: 18px;
  width: 20px;
  height: 20px;
  background: inherit;
  transform: rotate(45deg);
  border-bottom-right-radius: 8px;
}

.logo__bubble::before {
  content: '';
  position: absolute;
  top: 14px;
  left: 18px;
  right: 18px;
  height: 7px;
  border-radius: 7px;
  background: rgba(255, 255, 255, 0.75);
  box-shadow: 0 12px 0 rgba(255, 255, 255, 0.28);
}

.logo__spark {
  position: absolute;
  top: 8px;
  right: 14px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 0 12px rgba(255, 255, 255, 0.6),
    0 0 22px rgba(255, 255, 255, 0.4);
}

@media (max-width: 960px) {
  .logo {
    padding: 36px;
  }

  .logo__ring {
    width: 112px;
    height: 112px;
  }
}
</style>
