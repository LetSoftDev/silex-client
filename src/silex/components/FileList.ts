import { FileItem } from '../models/FileTypes'
import { EventEmitter } from '../utils/EventEmitter'
import { FileUtils } from '../utils/FileUtils'

/**
 * Типы сортировки файлов
 */
export type SortType = 'name' | 'type' | 'date' | 'size'

/**
 * Направление сортировки
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Компонент для отображения списка файлов
 */
export class FileList {
	private container: HTMLElement
	private fileListElement: HTMLElement
	private selectedFiles: FileItem[] = []
	private files: FileItem[] = []
	private events: EventEmitter = new EventEmitter()
	private maxFiles: number = 1
	private allowedTypes: string[] | undefined = undefined
	private sortType: SortType = 'name'
	private sortDirection: SortDirection = 'asc'
	private sortOrderElement: HTMLElement | null = null
	private foldersFirstCheckbox: HTMLInputElement | null = null
	private foldersFirst: boolean = true

	/**
	 * Создает компонент списка файлов
	 * @param container контейнер для отображения списка
	 */
	constructor(container: HTMLElement) {
		this.container = container
		this.fileListElement = document.createElement('div')
		this.fileListElement.className = 'silex-files'
		this.container.appendChild(this.fileListElement)

		// Добавляем элемент сортировки
		this.renderSortUI()
	}

	/**
	 * Создает UI для сортировки
	 */
	private renderSortUI(): void {
		const sortContainer = document.createElement('div')
		sortContainer.className = 'silex-sort-container'

		sortContainer.innerHTML = `
			<div class="silex-sort-label">Сортировка:</div>
			<select class="silex-sort-select">
				<option value="name">По имени</option>
				<option value="type">По типу</option>
				<option value="date">По дате</option>
				<option value="size">По размеру</option>
			</select>
			<button class="silex-sort-order">
				<span class="material-icons silex-icon">arrow_upward</span>
			</button>
			<div class="silex-folders-first">
				<input type="checkbox" id="folders-first" checked>
				<label for="folders-first">Папки первыми</label>
			</div>
		`

		this.container.insertBefore(sortContainer, this.fileListElement)

		// Получаем элементы управления
		const sortSelect = sortContainer.querySelector(
			'.silex-sort-select'
		) as HTMLSelectElement
		this.sortOrderElement = sortContainer.querySelector('.silex-sort-order')
		this.foldersFirstCheckbox = sortContainer.querySelector(
			'#folders-first'
		) as HTMLInputElement

		// Устанавливаем обработчики
		sortSelect.addEventListener('change', () => {
			this.setSortType(sortSelect.value as SortType)
		})

		if (this.sortOrderElement) {
			this.sortOrderElement.addEventListener('click', () => {
				this.toggleSortDirection()
			})
		}

		if (this.foldersFirstCheckbox) {
			this.foldersFirstCheckbox.addEventListener('change', () => {
				this.foldersFirst = this.foldersFirstCheckbox!.checked
				this.sortFiles()
			})
		}
	}

	/**
	 * Устанавливает тип сортировки
	 * @param type тип сортировки
	 */
	public setSortType(type: SortType): void {
		if (this.sortType !== type) {
			this.sortType = type
			this.sortFiles()
		}
	}

	/**
	 * Переключает направление сортировки
	 */
	public toggleSortDirection(): void {
		this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc'

		// Обновляем иконку
		if (this.sortOrderElement) {
			const icon = this.sortOrderElement.querySelector('.silex-icon')
			if (icon) {
				icon.textContent =
					this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'
			}
		}

		this.sortFiles()
	}

	/**
	 * Сортирует файлы согласно текущим настройкам
	 */
	private sortFiles(): void {
		if (!this.files.length) return

		// Если активирован режим "Папки первыми", разделяем и сортируем отдельно
		if (this.foldersFirst) {
			// Разделяем файлы и папки
			const directories = this.files.filter(file => file.isDirectory)
			const regularFiles = this.files.filter(file => !file.isDirectory)

			// Сортируем каждую группу отдельно
			this.sortFileArray(directories)
			this.sortFileArray(regularFiles)

			// Объединяем обратно
			this.files = [...directories, ...regularFiles]
		} else {
			// Сортируем все элементы вместе
			this.sortFileArray(this.files)
		}

		// Перерисовываем список
		this.render()
	}

	/**
	 * Сортирует массив файлов
	 * @param files массив файлов для сортировки
	 */
	private sortFileArray(files: FileItem[]): void {
		if (!files.length) return

		files.sort((a, b) => {
			let result = 0

			switch (this.sortType) {
				case 'name':
					result = a.name.localeCompare(b.name)
					break

				case 'type':
					// Сортируем по типу
					if (a.isDirectory && b.isDirectory) {
						// Папки сортируем по имени
						result = a.name.localeCompare(b.name)
					} else if (!a.isDirectory && !b.isDirectory) {
						// Файлы сортируем сначала по типу, затем по имени
						result = (a.type || '').localeCompare(b.type || '')
						if (result === 0) {
							result = a.name.localeCompare(b.name)
						}
					} else {
						// Не должны попадать сюда при режиме "Папки первыми"
						result = a.isDirectory ? -1 : 1
					}
					break

				case 'date':
					result = a.modifiedAt.getTime() - b.modifiedAt.getTime()
					// Если даты одинаковые, сортируем по имени
					if (result === 0) {
						result = a.name.localeCompare(b.name)
					}
					break

				case 'size':
					result = a.size - b.size
					// Если размеры одинаковые, сортируем по имени
					if (result === 0) {
						result = a.name.localeCompare(b.name)
					}
					break
			}

			// Инвертируем результат для сортировки по убыванию
			return this.sortDirection === 'asc' ? result : -result
		})
	}

	/**
	 * Устанавливает файлы для отображения
	 * @param files список файлов
	 */
	public setFiles(files: FileItem[]): void {
		this.files = Array.isArray(files) ? files : []

		// Сортируем файлы перед отображением
		this.sortFiles()
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
	 * @param types список разрешенных типов
	 */
	public setAllowedTypes(types: string[]): void {
		this.allowedTypes = types
	}

	/**
	 * Устанавливает режим отображения
	 * @param mode режим отображения (grid или list)
	 */
	public setViewMode(mode: 'grid' | 'list'): void {
		this.fileListElement.classList.toggle('list-view', mode === 'list')
		this.render()
	}

	/**
	 * Отрисовывает список файлов
	 */
	private render(): void {
		this.fileListElement.innerHTML = ''

		if (!Array.isArray(this.files)) {
			console.error('Ошибка: this.files не является массивом', this.files)
			return
		}

		this.files.forEach(file => {
			const fileElement = this.createFileItemElement(file)
			this.fileListElement.appendChild(fileElement)
		})
	}

	/**
	 * Фильтрует файлы по поисковому запросу
	 * @param searchTerm поисковой запрос
	 */
	public filterFiles(searchTerm: string): void {
		if (!searchTerm) {
			this.render()
			return
		}

		this.fileListElement.innerHTML = ''

		const filteredFiles = this.files.filter(file =>
			file.name.toLowerCase().includes(searchTerm.toLowerCase())
		)

		if (filteredFiles.length === 0) {
			const emptyMessage = document.createElement('div')
			emptyMessage.className = 'silex-empty-message'
			emptyMessage.textContent = 'Файлы не найдены'
			this.fileListElement.appendChild(emptyMessage)
			return
		}

		filteredFiles.forEach(file => {
			const fileElement = this.createFileItemElement(file)
			this.fileListElement.appendChild(fileElement)
		})
	}

	/**
	 * Создает DOM элемент для файла
	 * @param file информация о файле
	 */
	private createFileItemElement(file: FileItem): HTMLElement {
		const fileElement = document.createElement('div')
		fileElement.className = 'silex-file-item'
		fileElement.setAttribute('data-id', file.id)

		if (this.isFileSelected(file)) {
			fileElement.classList.add('selected')
		}

		// Создаем превью файла
		const filePreviewElement = document.createElement('div')
		filePreviewElement.className = 'silex-file-preview'

		// Отображаем иконку в зависимости от типа файла
		const fileIconClass = this.getFileTypeIconClass(file)

		if (file.type === 'image' && file.thumbnailUrl) {
			filePreviewElement.innerHTML = `<img src="${file.thumbnailUrl}" alt="${file.name}">`
		} else {
			filePreviewElement.innerHTML = `<div class="silex-icon-file ${fileIconClass}">
				<i class="material-icons">${this.getFileTypeIcon(file)}</i>
			</div>`
		}

		// Информация о файле
		const fileInfoElement = document.createElement('div')
		fileInfoElement.className = 'silex-file-info'

		const fileNameElement = document.createElement('div')
		fileNameElement.className = 'silex-file-name'
		fileNameElement.textContent = file.name

		const fileMetaElement = document.createElement('div')
		fileMetaElement.className = 'silex-file-meta'

		// Форматируем размер файла
		const fileSize = FileUtils.formatSize(file.size)
		const fileDate = FileUtils.formatDate(file.modifiedAt)

		fileMetaElement.innerHTML = `
			<span class="silex-file-type">${file.type}</span>
			<span class="silex-file-size">${fileSize}</span>
			<span class="silex-file-date">${fileDate}</span>
		`

		fileInfoElement.appendChild(fileNameElement)
		fileInfoElement.appendChild(fileMetaElement)

		// Собираем элемент воедино
		fileElement.appendChild(filePreviewElement)
		fileElement.appendChild(fileInfoElement)

		// Создаем действия для файла
		this.addFileActions(fileElement, file)

		// Обработчик клика по файлу
		fileElement.addEventListener('click', () => {
			// Если это директория, открываем ее
			if (file.isDirectory) {
				this.events.emit('openDirectory', file)
				return
			}

			// Переключаем выбор файла
			this.toggleFileSelection(file)
		})

		return fileElement
	}

	/**
	 * Создает действия для файла
	 * @param fileElement элемент файла
	 * @param file информация о файле
	 */
	private addFileActions(fileElement: HTMLElement, file: FileItem): void {
		const actionsElement = document.createElement('div')
		actionsElement.className = 'silex-file-actions'

		// Добавляем кнопки действий
		actionsElement.innerHTML = `
			${
				file.isDirectory
					? '<button class="silex-action-btn silex-open-btn"><i class="material-icons">folder_open</i></button>'
					: '<button class="silex-action-btn silex-preview-btn"><i class="material-icons">visibility</i></button>'
			}
			<button class="silex-action-btn silex-rename-btn"><i class="material-icons">edit</i></button>
			<button class="silex-action-btn silex-delete-btn"><i class="material-icons">delete</i></button>
		`

		fileElement.appendChild(actionsElement)

		// Добавляем обработчики событий для кнопок
		const openBtn = actionsElement.querySelector('.silex-open-btn')
		if (openBtn) {
			openBtn.addEventListener('click', e => {
				e.stopPropagation()
				this.events.emit('openDirectory', file)
			})
		}

		const previewBtn = actionsElement.querySelector('.silex-preview-btn')
		if (previewBtn) {
			previewBtn.addEventListener('click', e => {
				e.stopPropagation()
				this.events.emit('preview', file)
			})
		}

		const renameBtn = actionsElement.querySelector('.silex-rename-btn')
		if (renameBtn) {
			renameBtn.addEventListener('click', e => {
				e.stopPropagation()
				this.events.emit('rename', file)
			})
		}

		const deleteBtn = actionsElement.querySelector('.silex-delete-btn')
		if (deleteBtn) {
			deleteBtn.addEventListener('click', e => {
				e.stopPropagation()
				if (confirm(`Вы уверены, что хотите удалить ${file.name}?`)) {
					this.events.emit('delete', file)
				}
			})
		}
	}

	/**
	 * Определяет класс для иконки типа файла
	 * @param file информация о файле
	 */
	private getFileTypeIconClass(file: FileItem): string {
		if (file.isDirectory) {
			return 'folder'
		}

		// Convert file.type to string for comparison
		const fileType = String(file.type || '')

		switch (fileType) {
			case 'image':
				return 'image'
			case 'video':
				return 'video'
			case 'audio':
				return 'audio'
			case 'pdf':
				return 'pdf'
			case 'doc':
			case 'docx':
				return 'doc'
			case 'xls':
			case 'xlsx':
				return 'xls'
			case 'ppt':
			case 'pptx':
				return 'ppt'
			case 'zip':
			case 'rar':
			case 'tar':
			case 'gz':
				return 'zip'
			case 'html':
			case 'htm':
				return 'html'
			case 'css':
				return 'css'
			case 'js':
			case 'ts':
				return 'js'
			case 'json':
				return 'json'
			case 'txt':
				return 'txt'
			default:
				return ''
		}
	}

	/**
	 * Определяет иконку для типа файла
	 * @param file информация о файле
	 */
	private getFileTypeIcon(file: FileItem): string {
		if (file.isDirectory) {
			return 'folder'
		}

		switch (file.type) {
			case 'image':
				return 'image'
			case 'video':
				return 'videocam'
			case 'audio':
				return 'audiotrack'
			case 'document':
				return 'description'
			case 'archive':
				return 'archive'
			default:
				return 'insert_drive_file'
		}
	}

	/**
	 * Проверяет, выбран ли файл
	 * @param file файл для проверки
	 */
	private isFileSelected(file: FileItem): boolean {
		return this.selectedFiles.some(f => f.id === file.id)
	}

	/**
	 * Переключает выбор файла
	 * @param file файл для выбора/отмены выбора
	 */
	private toggleFileSelection(file: FileItem): void {
		// Проверяем, можно ли выбрать файл по типу
		if (this.allowedTypes && !this.allowedTypes.includes(file.type)) {
			return
		}

		const isSelected = this.isFileSelected(file)

		if (isSelected) {
			// Отменяем выбор файла
			this.selectedFiles = this.selectedFiles.filter(f => f.id !== file.id)
		} else {
			// Проверяем, не превышено ли максимальное количество файлов
			if (this.selectedFiles.length >= this.maxFiles) {
				if (this.maxFiles === 1) {
					// Если можно выбрать только один файл, заменяем его
					this.selectedFiles = [file]
				} else {
					// Иначе игнорируем выбор
					return
				}
			} else {
				// Добавляем файл к выбранным
				this.selectedFiles.push(file)
			}
		}

		// Обновляем отображение
		this.updateSelectionUI()

		// Уведомляем об изменении выбора
		this.events.emit('selectionChange', this.selectedFiles)
	}

	/**
	 * Обновляет UI для отображения выбранных файлов
	 */
	private updateSelectionUI(): void {
		// Сбрасываем классы выбора со всех элементов
		const fileElements =
			this.fileListElement.querySelectorAll('.silex-file-item')
		fileElements.forEach(element => {
			element.classList.remove('selected')
		})

		// Добавляем класс выбора выбранным файлам
		this.selectedFiles.forEach(file => {
			const fileElement = this.fileListElement.querySelector(
				`.silex-file-item[data-id="${file.id}"]`
			)
			if (fileElement) {
				fileElement.classList.add('selected')
			}
		})
	}

	/**
	 * Возвращает выбранные файлы
	 */
	public getSelectedFiles(): FileItem[] {
		return [...this.selectedFiles]
	}

	/**
	 * Очищает выбор файлов
	 */
	public clearSelection(): void {
		this.selectedFiles = []
		this.updateSelectionUI()
		this.events.emit('selectionChange', this.selectedFiles)
	}

	/**
	 * Устанавливает обработчик изменения выбора файлов
	 */
	public onSelectionChange(callback: (files: FileItem[]) => void): void {
		this.events.on('selectionChange', callback)
	}

	/**
	 * Устанавливает обработчик открытия директории
	 */
	public onOpenDirectory(callback: (file: FileItem) => void): void {
		this.events.on('openDirectory', callback)
	}

	/**
	 * Устанавливает обработчик скачивания файла
	 */
	public onDownload(callback: (file: FileItem) => void): void {
		this.events.on('download', callback)
	}

	/**
	 * Устанавливает обработчик удаления файла
	 */
	public onDelete(callback: (file: FileItem) => void): void {
		this.events.on('delete', callback)
	}

	/**
	 * Устанавливает обработчик предпросмотра файла
	 */
	public onPreview(callback: (file: FileItem) => void): void {
		this.events.on('preview', callback)
	}

	/**
	 * Устанавливает обработчик для переименования файла
	 * @param callback обработчик
	 */
	public onRename(callback: (file: FileItem) => void): void {
		this.events.on('rename', callback)
	}
}
