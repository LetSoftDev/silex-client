/**
 * Тип файла
 */
export type FileType =
	| 'image'
	| 'video'
	| 'audio'
	| 'document'
	| 'archive'
	| 'folder'
	| 'file'
	| 'code'
	| 'other'
	| 'pdf'
	| 'doc'
	| 'docx'
	| 'xls'
	| 'xlsx'
	| 'ppt'
	| 'pptx'
	| 'zip'
	| 'rar'
	| 'tar'
	| 'gz'
	| 'html'
	| 'htm'
	| 'css'
	| 'js'
	| 'ts'
	| 'json'
	| 'txt'

/**
 * Элемент файловой системы
 */
export interface FileItem {
	id: string
	name: string
	size: number
	modifiedAt: Date
	isDirectory: boolean
	type: FileType
	thumbnailUrl?: string // URL для предпросмотра изображений
	url?: string
	previewUrl?: string
	path?: string
	mimeType?: string
}

/**
 * Содержимое директории
 */
export interface DirectoryContents {
	path: string
	files: FileItem[]
	parentPath?: string
}

/**
 * Результат операции с файлом
 */
export interface FileOperationResult {
	success: boolean
	error?: string
	item?: FileItem
}

/**
 * Результат загрузки файла
 */
export interface UploadResult {
	success: boolean
	error?: string
	file?: FileItem
}

/**
 * Параметры для открытия менеджера файлов
 */
export interface SilexOptions {
	/**
	 * Начальный путь
	 */
	initialPath?: string

	/**
	 * Максимальное количество выбираемых файлов
	 */
	maxFiles?: number

	/**
	 * Разрешенные типы файлов
	 */
	allowedTypes?: FileType[]

	/**
	 * Селектор для контейнера, в котором будет отображен менеджер файлов
	 * Если не указан, менеджер будет открыт в модальном окне
	 */
	container?: string

	/**
	 * Размеры модального окна
	 */
	modal?: {
		width?: string
		height?: string
	}

	/**
	 * Callback при успешном выборе файлов
	 */
	onFinish?: (files: FileItem[]) => void

	/**
	 * Callback при отмене выбора
	 */
	onCancel?: () => void
}
