import { FileItem, FileType } from '../models/FileTypes'
import { FileSystemService, DiskSpaceInfo } from '../services/FileSystemService'
import { Toolbar } from './Toolbar'
import { Sidebar } from './Sidebar'
import { FileList } from './FileList'
import { EventEmitter } from '../utils/EventEmitter'
import { FileUtils } from '../utils/FileUtils'

/**
 * Основной компонент файлового менеджера
 */
export class FileBrowser {
	private container: HTMLElement
	private fileSystemService: FileSystemService
	private toolbar: Toolbar
	private sidebar: Sidebar
	private fileList: FileList
	private contentContainer: HTMLElement
	private loadingElement: HTMLElement
	private footerElement: HTMLElement
	private maxFiles: number = 1
	private allowedTypes: FileType[] | undefined
	private currentPath: string = '/'
	private events: EventEmitter = new EventEmitter()
	private searchTimeout: number | undefined

	/**
	 * Создает браузер файлов
	 * @param container контейнер для отображения
	 * @param initialPath начальный путь
	 */
	constructor(container: HTMLElement, initialPath: string = '/') {
		this.container = container
		
		// Создаем систему событий
		this.events = new EventEmitter()
		
		// Инициализируем службы
		this.fileSystemService = new FileSystemService()
		
		// Инициализируем UI
		this.currentPath = initialPath

		// Применяем базовый класс к контейнеру
		this.container.classList.add('silex-container')

		// Создаем структуру UI
		this.container.innerHTML = `
			<!-- Header с поиском и действиями будет добавлен через Toolbar -->
			
			<div class="silex-content">
				<!-- Sidebar будет добавлен через Sidebar -->
				<!-- Files будут добавлены через FileList -->
			</div>
			
			<div class="silex-loading">
				<div class="silex-loading-spinner"></div>
				<div class="silex-loading-text">Загрузка...</div>
			</div>
			
			<div class="silex-footer">
				<span class="silex-footer-path">Путь: /</span>
				<div class="silex-disk-space">
					<div class="silex-disk-space-bar">
						<div class="silex-disk-space-used" style="width: 0%"></div>
					</div>
					<div class="silex-disk-space-info">
						Загрузка информации о диске...
					</div>
				</div>
			</div>
		`

		// Находим элементы для дальнейшего использования
		this.contentContainer = this.container.querySelector(
			'.silex-content'
		) as HTMLElement
		this.loadingElement = this.container.querySelector(
			'.silex-loading'
		) as HTMLElement
		this.footerElement = this.container.querySelector(
			'.silex-footer'
		) as HTMLElement

		// Создаем компоненты
		this.toolbar = new Toolbar(this.container)
		this.sidebar = new Sidebar(this.contentContainer)

		// Создаем контейнер для списка файлов
		const filesContainer = document.createElement('div')
		filesContainer.className = 'silex-files-container'
		this.contentContainer.appendChild(filesContainer)

		this.fileList = new FileList(filesContainer)

		// Настраиваем обработчики событий
		this.setupEvents()

		// Загружаем начальную директорию
		this.loadDirectory(initialPath)
	}

	/**
	 * Загружает информацию о дисковом пространстве
	 */
	private loadDiskSpaceInfo(): void {
		this.fileSystemService
			.getDiskSpaceInfo()
			.then(info => {
				this.updateDiskSpaceUI(info)
			})
			.catch(error => {
				console.error('Ошибка при загрузке информации о диске:', error)

				const diskSpaceInfo = this.container.querySelector(
					'.silex-disk-space-info'
				)
				if (diskSpaceInfo) {
					diskSpaceInfo.textContent = 'Не удалось загрузить информацию о диске'
				}
			})
	}

	/**
	 * Обновляет UI с информацией о дисковом пространстве
	 * @param info информация о дисковом пространстве
	 */
	private updateDiskSpaceUI(info: DiskSpaceInfo): void {
		// Находим элементы UI
		const diskSpaceBar = this.container.querySelector(
			'.silex-disk-space-used'
		) as HTMLElement
		const diskSpaceInfo = this.container.querySelector('.silex-disk-space-info')

		if (!diskSpaceBar || !diskSpaceInfo) return

		// Вычисляем процент использования диска
		const usagePercent = Math.min(
			Math.round((info.usedSpace / info.totalSpace) * 100),
			100
		)

		// Обновляем индикатор
		diskSpaceBar.style.width = `${usagePercent}%`

		// Устанавливаем цвет в зависимости от заполненности
		if (usagePercent > 90) {
			diskSpaceBar.style.backgroundColor = '#e74c3c' // red
		} else if (usagePercent > 70) {
			diskSpaceBar.style.backgroundColor = '#f39c12' // orange
		} else {
			diskSpaceBar.style.backgroundColor = '#2ecc71' // green
		}

		// Форматируем размеры для отображения
		const freeSpaceFormatted = FileUtils.formatSize(info.freeSpace)
		const totalSpaceFormatted = FileUtils.formatSize(info.totalSpace)
		const uploadsDirSizeFormatted = FileUtils.formatSize(info.uploadsDirSize)

		// Обновляем текст
		diskSpaceInfo.innerHTML = `
			Свободно: <strong>${freeSpaceFormatted}</strong> из <strong>${totalSpaceFormatted}</strong>
			&nbsp;|&nbsp;
			Использовано в uploads: <strong>${uploadsDirSizeFormatted}</strong>
		`
	}

	/**
	 * Настраивает обработчики событий компонентов
	 */
	private setupEvents(): void {
		// Обработчики событий панели инструментов
		this.toolbar.onSearch(searchTerm => {
			if (this.searchTimeout !== undefined) {
				clearTimeout(this.searchTimeout)
			}

			this.searchTimeout = window.setTimeout(() => {
				this.fileList.filterFiles(searchTerm)
			}, 300)
		})

		this.toolbar.onUpload(() => {
			this.promptUploadFiles()
		})

		this.toolbar.onCreateFolder(() => {
			this.promptCreateFolder()
		})

		this.toolbar.onViewChange(viewMode => {
			this.fileList.setViewMode(viewMode)
		})

		// Обработчики событий боковой панели
		this.sidebar.onPathChange(path => {
			this.loadDirectory(path)
		})

		// Обработчики событий списка файлов
		this.fileList.onOpenDirectory(directory => {
			const newPath =
				this.currentPath === '/'
					? `/${directory.name}`
					: `${this.currentPath}/${directory.name}`

			this.loadDirectory(newPath)
		})

		this.fileList.onSelectionChange(files => {
			// Проверяем, не превышено ли максимальное количество файлов
			if (files.length > this.maxFiles) {
				// Если превышено, показываем предупреждение
				console.warn(
					`Максимальное количество выбранных файлов: ${this.maxFiles}`
				)

				// Сбрасываем выбор, переустановив текущие файлы
				this.fileSystemService
					.getFiles(this.currentPath)
					.then(freshFiles => {
						// Используем существующую логику фильтрации
						const filteredFiles =
							this.allowedTypes && this.allowedTypes.length > 0
								? freshFiles.filter(
										file =>
											file.isDirectory ||
											!file.type ||
											this.allowedTypes?.includes(file.type)
								  )
								: freshFiles

						this.fileList.setFiles(filteredFiles)
					})
					.catch(error => {
						console.error('Ошибка обновления списка файлов:', error)
					})

				return
			}

			this.events.emit('selectionChange', files)
		})

		this.fileList.onDelete(file => {
			// Подтверждение встроено в UI
			this.deleteFile(file)
		})

		this.fileList.onDownload(file => {
			// Временная реализация скачивания
			if (file.url) {
				window.open(file.url, '_blank')
			}
		})

		this.fileList.onPreview(file => {
			// Открываем предпросмотр файла
			if (file.type === 'image' && file.url) {
				window.open(file.url, '_blank')
			}
		})

		this.fileList.onRename(file => {
			// Запрашиваем новое имя
			this.promptRenameFile(file)
		})
	}

	/**
	 * Загружает содержимое директории
	 * @param path путь для загрузки
	 */
	private loadDirectory(path: string): void {
		// Показываем индикатор загрузки
		this.showLoading(true)

		// Обновляем текущий путь
		this.currentPath = path

		// Обновляем путь в боковой панели
		this.sidebar.setActivePath(path)

		// Обновляем путь в футере
		const pathElement = this.footerElement.querySelector('.silex-footer-path')
		if (pathElement) {
			pathElement.textContent = `Путь: ${path}`
		}

		// Обновляем информацию о дисковом пространстве
		this.loadDiskSpaceInfo()

		// Загружаем файлы
		this.fileSystemService
			.getFiles(path)
			.then(files => {
				// Проверяем что получили массив
				const fileArray = Array.isArray(files) ? files : []

				// Фильтруем файлы по разрешенным типам если они заданы
				const filteredFiles =
					this.allowedTypes && this.allowedTypes.length > 0
						? fileArray.filter(
								file =>
									file.isDirectory ||
									!file.type ||
									this.allowedTypes?.includes(file.type)
						  )
						: fileArray

				// Устанавливаем файлы в список
				this.fileList.setFiles(filteredFiles)

				// Скрываем индикатор загрузки
				this.showLoading(false)
			})
			.catch(error => {
				console.error('Ошибка загрузки файлов:', error)
				this.fileList.setFiles([]) // Устанавливаем пустой массив в случае ошибки
				this.showLoading(false)
			})
	}

	/**
	 * Отображает/скрывает индикатор загрузки
	 * @param show флаг отображения
	 */
	private showLoading(show: boolean): void {
		this.loadingElement.classList.toggle('visible', show)

		// Делаем список файлов полупрозрачным при загрузке
		const filesElement = this.container.querySelector('.silex-files')
		if (filesElement) {
			filesElement.classList.toggle('loading', show)
		}
	}

	/**
	 * Запрашивает создание новой папки
	 */
	private promptCreateFolder(): void {
		const folderName = prompt('Введите имя новой папки:')
		if (folderName) {
			this.createFolder(folderName)
		}
	}

	/**
	 * Создает новую папку
	 * @param folderName имя папки
	 */
	private createFolder(folderName: string): void {
		if (!folderName.trim()) return

		this.showLoading(true)

		this.fileSystemService
			.createFolder(this.currentPath, folderName)
			.then(() => {
				// Перезагружаем текущую директорию
				this.loadDirectory(this.currentPath)
			})
			.catch(error => {
				console.error('Ошибка при создании папки:', error)
				this.showLoading(false)
			})
	}

	/**
	 * Запрашивает загрузку файлов
	 */
	private promptUploadFiles(): void {
		// Создаем скрытый input для выбора файлов
		const input = document.createElement('input')
		input.type = 'file'
		input.multiple = true
		input.style.display = 'none'

		// Добавляем в DOM
		document.body.appendChild(input)

		// Настраиваем обработчики
		input.addEventListener('change', e => {
			const files = (e.target as HTMLInputElement).files

			if (files && files.length > 0) {
				this.uploadFiles(files)
			}

			// Удаляем временный элемент
			document.body.removeChild(input)
		})

		// Открываем диалог выбора файлов
		input.click()
	}

	/**
	 * Загружает файлы на сервер
	 * @param files файлы для загрузки
	 */
	private uploadFiles(files: globalThis.FileList): void {
		if (!files || files.length === 0) return

		this.showLoading(true)

		this.fileSystemService
			.uploadFiles(this.currentPath, files)
			.then(() => {
				// После загрузки обновляем текущую директорию
				this.loadDirectory(this.currentPath)
			})
			.catch(error => {
				console.error('Ошибка при загрузке файлов:', error)
				this.showLoading(false)
			})
	}

	/**
	 * Удаляет файл или папку
	 * @param file файл для удаления
	 */
	private deleteFile(file: FileItem): void {
		this.showLoading(true)

		// Формируем полный путь к файлу
		let filePath

		if (file.path && file.path !== '/') {
			// Если есть путь и он не корень
			filePath = file.path === '/' ? file.name : `${file.path}/${file.name}`
		} else {
			// Если нет пути или путь корневой, используем currentPath
			filePath =
				this.currentPath === '/'
					? file.name
					: `${this.currentPath}/${file.name}`
		}

		console.log('Путь для удаления:', {
			fullPath: filePath,
			currentPath: this.currentPath,
			filePath: file.path,
			fileName: file.name,
		})

		this.fileSystemService
			.deleteFile(filePath)
			.then(() => {
				// Перезагружаем текущую директорию
				this.loadDirectory(this.currentPath)
			})
			.catch(error => {
				console.error('Ошибка при удалении файла:', error)
				this.showLoading(false)
				alert(
					`Ошибка при удалении файла: ${error.message || 'Неизвестная ошибка'}`
				)
			})
	}

	/**
	 * Запрашивает новое имя для файла или папки
	 * @param file файл для переименования
	 */
	private promptRenameFile(file: FileItem): void {
		const newName = prompt('Введите новое имя:', file.name)
		if (newName && newName !== file.name) {
			this.renameFile(file, newName)
		}
	}

	/**
	 * Переименовывает файл или папку
	 * @param file файл для переименования
	 * @param newName новое имя
	 */
	private renameFile(file: FileItem, newName: string): void {
		if (!newName.trim()) return

		this.showLoading(true)

		// Формируем полный путь к файлу
		let filePath

		if (file.path && file.path !== '/') {
			// Если есть путь и он не корень
			filePath = file.path === '/' ? file.name : `${file.path}/${file.name}`
		} else {
			// Если нет пути или путь корневой, используем currentPath
			filePath =
				this.currentPath === '/'
					? file.name
					: `${this.currentPath}/${file.name}`
		}

		console.log('Путь для переименования:', {
			fullPath: filePath,
			currentPath: this.currentPath,
			filePath: file.path,
			fileName: file.name,
		})

		this.fileSystemService
			.renameFile(filePath, newName)
			.then(() => {
				// Перезагружаем текущую директорию
				this.loadDirectory(this.currentPath)
			})
			.catch(error => {
				console.error('Ошибка при переименовании файла:', error)
				this.showLoading(false)
				alert(
					`Ошибка при переименовании файла: ${
						error.message || 'Неизвестная ошибка'
					}`
				)
			})
	}

	/**
	 * Устанавливает максимальное количество выбираемых файлов
	 * @param maxFiles максимальное количество файлов
	 */
	public setMaxFiles(maxFiles: number): void {
		this.maxFiles = maxFiles
	}

	/**
	 * Устанавливает разрешенные типы файлов
	 * @param types типы файлов
	 */
	public setAllowedTypes(types: FileType[]): void {
		this.allowedTypes = types
	}

	/**
	 * Возвращает выбранные файлы
	 */
	public getSelectedFiles(): FileItem[] {
		return this.fileList.getSelectedFiles()
	}

	/**
	 * Устанавливает обработчик изменения выбранных файлов
	 * @param callback функция обратного вызова
	 */
	public setOnSelectionChange(callback: (files: FileItem[]) => void): void {
		this.events.on('selectionChange', callback)
	}

	/**
	 * Инициализирует контейнер браузера файлов
	 */
	private initContainer(): void {
		// Применяем базовый класс к контейнеру
		this.container.classList.add('silex-container')

		// Создаем структуру UI
		this.container.innerHTML = `
			<!-- Header с поиском и действиями будет добавлен через Toolbar -->
			
			<div class="silex-content">
				<!-- Sidebar будет добавлен через Sidebar -->
				<!-- Files будут добавлены через FileList -->
			</div>
			
			<div class="silex-loading">
				<div class="silex-loading-spinner"></div>
				<div class="silex-loading-text">Загрузка...</div>
			</div>
			
			<div class="silex-footer">
				<span class="silex-footer-path">Путь: /</span>
				<div class="silex-disk-space">
					<div class="silex-disk-space-bar">
						<div class="silex-disk-space-used" style="width: 0%"></div>
					</div>
					<div class="silex-disk-space-info">
						Загрузка информации о диске...
					</div>
				</div>
			</div>
		`

		// Находим элементы для дальнейшего использования
		this.contentContainer = this.container.querySelector(
			'.silex-content'
		) as HTMLElement
		this.loadingElement = this.container.querySelector(
			'.silex-loading'
		) as HTMLElement
		this.footerElement = this.container.querySelector(
			'.silex-footer'
		) as HTMLElement

		// Загружаем информацию о дисковом пространстве
		this.loadDiskSpaceInfo()
	}
}
