import { apiClient } from './apiClient'

const VERIFICATION_CODE_TYPE = 2

export const requestPasswordResetCode = (email) => {
  return apiClient.post('/user/getVerfCode', {
    email,
    verfCodeType: VERIFICATION_CODE_TYPE,
  })
}

export const recoverPassword = ({
  email,
  code,
  password,
  passwordConfirm,
}) => {
  return apiClient.post('/user/recoverPassword', {
    email,
    verfCode: code,
    newPassword: password,
    newPasswordConfirm: passwordConfirm,
  })
}
