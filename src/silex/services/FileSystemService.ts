import {
	DirectoryContents,
	FileOperationResult,
	UploadResult,
	FileItem,
} from '../models/FileTypes'

/**
 * Информация о дисковом пространстве
 */
export interface DiskSpaceInfo {
	freeSpace: number
	totalSpace: number
	usedSpace: number
	uploadsDirSize: number
}

/**
 * Сервис для работы с файлами через REST API
 */
export class FileSystemService {
	private readonly API_URL = '/api'

	/**
	 * Создает новую директорию
	 */
	public async createDirectory(
		parentPath: string,
		name: string
	): Promise<FileOperationResult> {
		try {
			const response = await fetch(`${this.API_URL}/directory`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ path: parentPath, name }),
			})

			if (!response.ok) {
				const errorData = await response.json()
				return {
					success: false,
					error: errorData.error || 'Ошибка при создании директории',
				}
			}

			const data = await response.json()

			if (data.item) {
				// Преобразуем строковую дату в объект Date
				data.item.modifiedAt = new Date(data.item.modifiedAt)
			}

			return data
		} catch (error) {
			console.error('Ошибка при создании директории:', error)
			return {
				success: false,
				error: 'Ошибка при создании директории',
			}
		}
	}

	/**
	 * Загружает файл
	 */
	public async uploadFile(dirPath: string, file: File): Promise<UploadResult> {
		try {
			const formData = new FormData()
			formData.append('file', file)

			const response = await fetch(
				`${this.API_URL}/upload?path=${encodeURIComponent(dirPath)}`,
				{
					method: 'POST',
					body: formData,
				}
			)

			if (!response.ok) {
				const errorData = await response.json()
				return {
					success: false,
					error: errorData.error || 'Ошибка при загрузке файла',
				}
			}

			const data = await response.json()

			if (data.file) {
				// Преобразуем строковую дату в объект Date
				data.file.modifiedAt = new Date(data.file.modifiedAt)

				// Добавляем URL для предпросмотра, если это изображение
				if (data.file.type === 'image') {
					data.file.url = data.file.thumbnailUrl
				}
			}

			return data
		} catch (error) {
			console.error('Ошибка при загрузке файла:', error)
			return {
				success: false,
				error: 'Ошибка при загрузке файла',
			}
		}
	}

	/**
	 * Удаляет файл или директорию
	 */
	public async deleteItem(id: string): Promise<FileOperationResult> {
		try {
			const response = await fetch(`${this.API_URL}/delete/${id}`, {
				method: 'DELETE',
			})

			if (!response.ok) {
				const errorData = await response.json()
				return {
					success: false,
					error: errorData.error || 'Ошибка при удалении файла',
				}
			}

			return await response.json()
		} catch (error) {
			console.error('Ошибка при удалении файла:', error)
			return {
				success: false,
				error: 'Ошибка при удалении файла',
			}
		}
	}

	/**
	 * Переименовывает файл или директорию
	 */
	public async renameItem(
		id: string,
		newName: string
	): Promise<FileOperationResult> {
		try {
			const response = await fetch(`${this.API_URL}/rename/${id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ newName }),
			})

			if (!response.ok) {
				const errorData = await response.json()
				return {
					success: false,
					error: errorData.error || 'Ошибка при переименовании файла',
				}
			}

			const data = await response.json()

			if (data.item) {
				// Преобразуем строковую дату в объект Date
				data.item.modifiedAt = new Date(data.item.modifiedAt)

				// Добавляем URL для предпросмотра, если это изображение
				if (data.item.type === 'image' && data.item.thumbnailUrl) {
					data.item.url = data.item.thumbnailUrl
				}
			}

			return data
		} catch (error) {
			console.error('Ошибка при переименовании файла:', error)
			return {
				success: false,
				error: 'Ошибка при переименовании файла',
			}
		}
	}

	/**
	 * Получает список файлов в директории
	 * @param path путь к директории
	 * @returns список файлов
	 */
	public async getFiles(path: string): Promise<FileItem[]> {
		try {
			const response = await fetch(
				`${this.API_URL}/files?path=${encodeURIComponent(path)}`
			)
			if (!response.ok) {
				throw new Error(`Ошибка HTTP: ${response.status}`)
			}

			const data = await response.json()

			// Преобразуем строковые даты в объекты Date и добавляем URL если нужно
			const files = data.files.map((file: any) => ({
				...file,
				modifiedAt: new Date(file.modifiedAt),
				url: file.thumbnailUrl || undefined,
			}))

			return files
		} catch (error) {
			console.error('Ошибка при получении файлов:', error)
			return [] // Возвращаем пустой массив вместо ошибки
		}
	}

	/**
	 * Получает содержимое директории
	 * @param path путь к директории
	 * @returns содержимое директории
	 */
	public async getDirectoryContents(path: string): Promise<DirectoryContents> {
		try {
			const response = await fetch(
				`${this.API_URL}/files?path=${encodeURIComponent(path)}`
			)

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(
					errorData.error || 'Ошибка при получении содержимого директории'
				)
			}

			const data = await response.json()

			// Преобразуем строковую дату в объект Date
			const files = data.files.map((file: any) => ({
				...file,
				modifiedAt: new Date(file.modifiedAt),
				url: file.thumbnailUrl || undefined,
			}))

			return {
				path: data.path,
				parentPath: data.parentPath,
				files,
			}
		} catch (error) {
			console.error('Ошибка при получении содержимого директории:', error)

			// Возвращаем пустой список в случае ошибки
			return {
				path,
				files: [],
				parentPath: path === '' ? undefined : '/',
			}
		}
	}

	/**
	 * Создает новую папку
	 * @param path путь, где создать папку
	 * @param folderName имя новой папки
	 * @returns результат операции
	 */
	public async createFolder(
		path: string,
		folderName: string
	): Promise<boolean> {
		try {
			const response = await fetch(`${this.API_URL}/directory`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ path, name: folderName }),
			})

			if (!response.ok) {
				throw new Error(`Ошибка HTTP: ${response.status}`)
			}

			return true
		} catch (error) {
			console.error('Ошибка при создании папки:', error)
			throw error
		}
	}

	/**
	 * Загружает файлы на сервер
	 * @param path путь, куда загрузить файлы
	 * @param files файлы для загрузки
	 * @returns результат операции
	 */
	public async uploadFiles(path: string, files: FileList): Promise<boolean> {
		try {
			// Загружаем файлы по одному
			for (let i = 0; i < files.length; i++) {
				const formData = new FormData()
				formData.append('file', files[i])

				const response = await fetch(
					`${this.API_URL}/upload?path=${encodeURIComponent(path)}`,
					{
						method: 'POST',
						body: formData,
					}
				)

				if (!response.ok) {
					throw new Error(`Ошибка HTTP: ${response.status}`)
				}
			}

			return true
		} catch (error) {
			console.error('Ошибка при загрузке файлов:', error)
			throw error
		}
	}

	/**
	 * Удаляет файл или папку
	 * @param path путь к удаляемому элементу
	 * @returns результат операции
	 */
	public async deleteFile(path: string): Promise<boolean> {
		try {
			// Генерируем временный id для API
			const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()

			// Проверяем, если путь начинается со слеша и не равен корню, убираем слеш
			const normalizedPath =
				path === '/' ? '' : path.startsWith('/') ? path.substring(1) : path

			const response = await fetch(
				`${this.API_URL}/delete/${id}?path=${encodeURIComponent(
					normalizedPath
				)}`,
				{
					method: 'DELETE',
				}
			)

			if (!response.ok) {
				throw new Error(`Ошибка HTTP: ${response.status}`)
			}

			return true
		} catch (error) {
			console.error('Ошибка при удалении файла:', error)
			throw error
		}
	}

	/**
	 * Переименовывает файл или папку
	 * @param path путь к элементу
	 * @param newName новое имя
	 * @returns результат операции
	 */
	public async renameFile(path: string, newName: string): Promise<boolean> {
		try {
			// Генерируем временный id для API
			const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()

			// Получаем директорию из пути и нормализуем пути
			const lastSlashIndex = path.lastIndexOf('/')
			let dirPath
			let oldPath

			if (lastSlashIndex < 0) {
				// Файл в корне
				dirPath = '/'
				oldPath = path
			} else if (lastSlashIndex === 0) {
				// Файл в корне с начальным /
				dirPath = '/'
				oldPath = path.substring(1)
			} else {
				// Файл в подпапке
				dirPath = path.substring(0, lastSlashIndex)
				oldPath = path.substring(lastSlashIndex + 1)
			}

			console.log('Переименование:', { path, dirPath, oldPath, newName })

			const response = await fetch(
				`${this.API_URL}/rename/${id}?path=${encodeURIComponent(
					oldPath
				)}&dir=${encodeURIComponent(dirPath === '/' ? '' : dirPath)}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ newName }),
				}
			)

			if (!response.ok) {
				const errorMessage = await response.text()
				console.error('Ошибка переименования:', errorMessage)
				throw new Error(`Ошибка HTTP: ${response.status} - ${errorMessage}`)
			}

			return true
		} catch (error) {
			console.error('Ошибка при переименовании файла:', error)
			throw error
		}
	}

	/**
	 * Получает информацию о дисковом пространстве
	 * @returns информация о дисковом пространстве
	 */
	public async getDiskSpaceInfo(): Promise<DiskSpaceInfo> {
		try {
			const response = await fetch(`${this.API_URL}/disk-space`)

			if (!response.ok) {
				throw new Error(`Ошибка HTTP: ${response.status}`)
			}

			const data = await response.json()

			if (!data.success) {
				throw new Error(data.error || 'Ошибка при получении информации о диске')
			}

			return data.data
		} catch (error) {
			console.error('Ошибка при получении информации о диске:', error)
			// Возвращаем нулевые значения в случае ошибки
			return {
				freeSpace: 0,
				totalSpace: 0,
				usedSpace: 0,
				uploadsDirSize: 0,
			}
		}
	}
}
