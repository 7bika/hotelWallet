import axios from "axios"

const API_BASE_URL = "http://192.168.1.12:3000/api/users"

export const getUserInfo = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/me`)
    return response.data
  } catch (error) {
    throw new Error("Failed to fetch user information")
  }
}

export const updateUserInfo = async (userInfo) => {
  try {
    await axios.patch(`${API_BASE_URL}/updateMe`, userInfo)
  } catch (error) {
    throw new Error("Failed to update user information")
  }
}

export const deleteAccount = async () => {
  try {
    await axios.delete(`${API_BASE_URL}/deleteMe`)
  } catch (error) {
    throw new Error("Failed to delete user account")
  }
}

export const updatePassword = async (currentPassword, newPassword) => {
  try {
    await axios.patch(`${API_BASE_URL}/updateMyPassword`, {
      passwordCurrent: currentPassword,
      password: newPassword,
    })
  } catch (error) {
    throw new Error("Failed to update user password")
  }
}
