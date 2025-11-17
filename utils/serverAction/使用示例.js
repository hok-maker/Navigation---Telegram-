/**
 * Server Action 工具使用示例
 * 展示如何在现有的 Actions.js 中使用新的工具函数
 */

// ========== 导入新工具 ==========
'use server'
import { 
  success, 
  error, 
  permissionDenied,
  withServerAction, 
  withPermissionCheck,
  connectDB3 
} from '@/utils'

// ========== 改进前的代码（你现有的风格）==========
/*
export async function toggleCurfewStatus(formData) {
  try {
    const mockUserId = "mock_admin_user"
    if (!(await mockHasPermission(mockUserId, "upperAdmin"))) {
      throw new Error("您没有权限进行此操作。")
    }

    await connectDB3()
    const currentSettings = await getCurfewSettings()
    if (!currentSettings) {
      throw new Error("无法获取当前宵禁设置。")
    }
    
    const newStatus = currentSettings.status === "on" ? "off" : "on"
    await db3.shezhi?.updateOne(
      { key: "宵禁设置" },
      { $set: { status: newStatus, updatedAt: new Date() } }
    )
    
    return { 
      success: true, 
      message: `宵禁状态已切换为 ${newStatus.toUpperCase()}`,
      newStatus 
    }
    
  } catch (error) {
    console.warn("处理 toggleCurfewStatus 操作时发生错误:", error)
    throw error
  }
}
*/

// ========== 改进后的代码（使用新工具）==========

/**
 * 示例1：基础错误处理 - 使用 withServerAction
 */
export const toggleCurfewStatusV2 = withServerAction(async (formData) => {
  const mockUserId = "mock_admin_user"
  if (!(await mockHasPermission(mockUserId, "upperAdmin"))) {
    return permissionDenied("您没有权限进行此操作")  // 统一权限错误格式
  }

  await connectDB3()
  const currentSettings = await getCurfewSettings()
  if (!currentSettings) {
    return error("无法获取当前宵禁设置")  // 统一错误格式
  }
  
  const newStatus = currentSettings.status === "on" ? "off" : "on"
  await db3.shezhi?.updateOne(
    { key: "宵禁设置" },
    { $set: { status: newStatus, updatedAt: new Date() } }
  )
  
  return success(
    { newStatus },  // 数据
    `宵禁状态已切换为 ${newStatus.toUpperCase()}`  // 消息
  )
})

/**
 * 示例2：带权限检查的高级用法 - 使用 withPermissionCheck
 */
export const toggleCurfewStatusV3 = withPermissionCheck(
  async (formData) => {
    await connectDB3()
    const currentSettings = await getCurfewSettings()
    if (!currentSettings) {
      return error("无法获取当前宵禁设置")
    }
    
    const newStatus = currentSettings.status === "on" ? "off" : "on"
    await db3.shezhi?.updateOne(
      { key: "宵禁设置" },
      { $set: { status: newStatus, updatedAt: new Date() } }
    )
    
    return success(
      { newStatus },
      `宵禁状态已切换为 ${newStatus.toUpperCase()}`
    )
  },
  // 权限检查函数
  async (formData) => {
    const mockUserId = "mock_admin_user"
    return await mockHasPermission(mockUserId, "upperAdmin")
  }
)

/**
 * 示例3：简单的CRUD操作
 */
export const createPost = withServerAction(async (formData) => {
  const title = formData.get('title')
  const content = formData.get('content')
  
  if (!title || !content) {
    return error("标题和内容不能为空")
  }
  
  await connectDB()
  const post = {
    title,
    content,
    createdAt: new Date()
  }
  
  const result = await db.posts.insertOne(post)
  return success(result, "帖子创建成功")
})

export const deletePost = withServerAction(async (postId) => {
  await connectDB()
  const result = await db.posts.deleteOne({ _id: postId })
  
  if (result.deletedCount === 0) {
    return error("帖子不存在或已被删除")
  }
  
  return success(null, "帖子删除成功")
})

// ========== 对比总结 ==========
/*
✅ 使用新工具的优势：

1. **代码更简洁**
   - 无需每个函数都写 try-catch
   - 统一的响应格式

2. **错误处理统一**
   - 自动错误日志记录
   - 一致的错误响应格式

3. **类型安全的响应**
   - success({ data }, "message")
   - error("message")
   - permissionDenied("message")

4. **功能分离**
   - 权限检查可以单独提取
   - 业务逻辑更清晰

5. **前端调用简单**
   const result = await toggleCurfewStatusV2(formData)
   if (result.success) {
     console.log(result.message, result.data)
   } else {
     console.error(result.message)
   }
*/
