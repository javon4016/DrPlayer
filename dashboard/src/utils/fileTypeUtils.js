/**
 * 文件类型识别工具函数
 * 根据文件名返回对应的 iconfont 图标类名
 */

/**
 * 根据文件名获取对应的文件类型图标类名
 * @param {string} fileName - 文件名
 * @returns {string} 对应的 iconfont 图标类名
 */
export function getFileTypeIcon(fileName) {
  if (!fileName || typeof fileName !== 'string') {
    return 'icon-file'
  }

  // 获取文件扩展名（转为小写）
  const extension = fileName.toLowerCase().split('.').pop()
  
  // 文档类型
  const documentTypes = {
    'doc': 'icon-file_word',
    'docx': 'icon-file_word',
    'xls': 'icon-file_excel',
    'xlsx': 'icon-file_excel',
    'ppt': 'icon-file_ppt',
    'pptx': 'icon-file_ppt',
    'pdf': 'icon-file_pdf',
    'txt': 'icon-file_txt',
    'rtf': 'icon-file_txt',
    'md': 'icon-file_txt'
  }
  
  // 图片类型
  const imageTypes = {
    'jpg': 'icon-file_img',
    'jpeg': 'icon-file_img',
    'png': 'icon-file_img',
    'gif': 'icon-file_img',
    'bmp': 'icon-file_img',
    'svg': 'icon-file_img',
    'webp': 'icon-file_img',
    'ico': 'icon-file_img'
  }
  
  // 视频类型
  const videoTypes = {
    'mp4': 'icon-file_video',
    'avi': 'icon-file_video',
    'mkv': 'icon-file_video',
    'mov': 'icon-file_video',
    'wmv': 'icon-file_video',
    'flv': 'icon-file_video',
    'webm': 'icon-file_video',
    'm4v': 'icon-file_video',
    'rmvb': 'icon-file_video',
    'rm': 'icon-file_video'
  }
  
  // 音频类型
  const audioTypes = {
    'mp3': 'icon-file_music',
    'wav': 'icon-file_music',
    'flac': 'icon-file_music',
    'aac': 'icon-file_music',
    'ogg': 'icon-file_music',
    'wma': 'icon-file_music',
    'm4a': 'icon-file_music'
  }
  
  // 压缩包类型
  const archiveTypes = {
    'zip': 'icon-file_zip',
    'rar': 'icon-file_zip',
    '7z': 'icon-file_zip',
    'tar': 'icon-file_zip',
    'gz': 'icon-file_zip',
    'bz2': 'icon-file_zip'
  }
  
  // 可执行文件类型
  const executableTypes = {
    'exe': 'icon-file_exe',
    'msi': 'icon-file_exe',
    'dmg': 'icon-file_exe',
    'pkg': 'icon-file_exe',
    'deb': 'icon-file_exe',
    'rpm': 'icon-file_exe'
  }
  
  // 代码文件类型
  const codeTypes = {
    'html': 'icon-file_html',
    'htm': 'icon-file_html',
    'css': 'icon-file_code',
    'js': 'icon-file_code',
    'ts': 'icon-file_code',
    'vue': 'icon-file_code',
    'jsx': 'icon-file_code',
    'tsx': 'icon-file_code',
    'php': 'icon-file_code',
    'py': 'icon-file_code',
    'java': 'icon-file_code',
    'cpp': 'icon-file_code',
    'c': 'icon-file_code',
    'cs': 'icon-file_code',
    'go': 'icon-file_code',
    'rs': 'icon-file_code',
    'swift': 'icon-file_code',
    'kt': 'icon-file_code',
    'rb': 'icon-file_code',
    'json': 'icon-file_code',
    'xml': 'icon-file_code',
    'yaml': 'icon-file_code',
    'yml': 'icon-file_code'
  }
  
  // 设计文件类型
  const designTypes = {
    'ai': 'icon-file_ai',
    'psd': 'icon-file_psd',
    'sketch': 'icon-file_psd',
    'fig': 'icon-file_psd',
    'xd': 'icon-file_psd'
  }
  
  // CAD文件类型
  const cadTypes = {
    'dwg': 'icon-file_cad',
    'dxf': 'icon-file_cad',
    'step': 'icon-file_cad',
    'iges': 'icon-file_cad'
  }
  
  // Flash文件类型
  const flashTypes = {
    'swf': 'icon-file_flash',
    'fla': 'icon-file_flash'
  }
  
  // ISO文件类型
  const isoTypes = {
    'iso': 'icon-file_iso',
    'img': 'icon-file_iso',
    'bin': 'icon-file_iso'
  }
  
  // BT种子文件
  const btTypes = {
    'torrent': 'icon-file_bt'
  }
  
  // 云文件类型（一些云存储相关的文件）
  const cloudTypes = {
    'cloud': 'icon-file_cloud',
    'gdoc': 'icon-file_cloud',
    'gsheet': 'icon-file_cloud',
    'gslides': 'icon-file_cloud'
  }
  
  // 按优先级检查文件类型
  if (documentTypes[extension]) return documentTypes[extension]
  if (imageTypes[extension]) return imageTypes[extension]
  if (videoTypes[extension]) return videoTypes[extension]
  if (audioTypes[extension]) return audioTypes[extension]
  if (archiveTypes[extension]) return archiveTypes[extension]
  if (executableTypes[extension]) return executableTypes[extension]
  if (codeTypes[extension]) return codeTypes[extension]
  if (designTypes[extension]) return designTypes[extension]
  if (cadTypes[extension]) return cadTypes[extension]
  if (flashTypes[extension]) return flashTypes[extension]
  if (isoTypes[extension]) return isoTypes[extension]
  if (btTypes[extension]) return btTypes[extension]
  if (cloudTypes[extension]) return cloudTypes[extension]
  
  // 默认返回通用文件图标
  return 'icon-file'
}

/**
 * 检查项目是否为文件夹类型
 * @param {Object} item - 项目对象
 * @returns {boolean} 是否为文件夹
 */
export function isFolder(item) {
  return item && item.vod_tag && item.vod_tag.includes('folder')
}

/**
 * 检查项目是否为目录模式下的文件类型
 * @param {Object} item - 项目对象
 * @returns {boolean} 是否为目录模式下的文件
 */
export function isDirectoryFile(item) {
  return item && item.vod_tag && !item.vod_tag.includes('folder')
}

/**
 * 获取项目的显示图标类型
 * @param {Object} item - 项目对象
 * @returns {Object} 图标信息 { type: 'folder'|'file'|'image', iconClass?: string }
 */
export function getItemIconInfo(item) {
  if (!item) {
    return { type: 'image' }
  }
  
  if (isFolder(item)) {
    return { type: 'folder', iconClass: 'icon-wenjianjia' }
  }
  
  if (isDirectoryFile(item)) {
    return { type: 'file', iconClass: getFileTypeIcon(item.vod_name) }
  }
  
  return { type: 'image' }
}