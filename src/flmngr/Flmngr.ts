import { FileItem, FlmngrOptions } from './models/FileTypes'
import { FileBrowser } from './components/FileBrowser'
import './scss/main.scss'

/**
 * Основной класс файлового менеджера
 */
export class Flmngr {
	private options: FlmngrOptions
	private browser: FileBrowser | null = null
	private container: HTMLElement | null = null
	private isInitialized: boolean = false
	private selectedFiles: FileItem[] = []

	/**
	 * Создает экземпляр файлового менеджера
	 */
	constructor(options: FlmngrOptions = {}) {
		// Устанавливаем значения по умолчанию
		this.options = {
			initialPath: '/',
			maxFiles: 1,
			allowedTypes: undefined, // все типы разрешены
			container: undefined, // открываем в модальном окне
			modal: {
				width: '1000px',
				height: '600px',
			},
			onFinish: undefined,
			onCancel: undefined,
			...options,
		}
	}

	/**
	 * Открывает файловый менеджер
	 */
	public open(): void {
		// Если менеджер уже открыт, не открываем его повторно
		if (this.isInitialized) return

		// Если указан контейнер, открываем в нем
		if (this.options.container) {
			this.openEmbedded()
		} else {
			// Иначе открываем в модальном окне
			this.openModal()
		}

		this.isInitialized = true
	}

	/**
	 * Закрывает файловый менеджер
	 */
	public close(): void {
		if (!this.isInitialized) return

		// Сбрасываем состояние
		this.browser = null
		this.isInitialized = false
		this.selectedFiles = []
	}

	/**
	 * Получает выбранные файлы
	 */
	public getSelectedFiles(): FileItem[] {
		return this.selectedFiles
	}

	/**
	 * Открывает файловый менеджер в указанном контейнере
	 */
	private openEmbedded(): void {
		const containerSelector = this.options.container
		if (!containerSelector) return

		this.container = document.querySelector(containerSelector)
		if (!this.container) {
			console.error(
				`Контейнер для файлового менеджера не найден: ${containerSelector}`
			)
			return
		}

		// Создаем браузер в контейнере
		this.initBrowser(this.container)
	}

	/**
	 * Открывает файловый менеджер в модальном окне
	 */
	private openModal(): void {
		// Создаем контейнер для модального окна
		const modalContainer = document.createElement('div')
		modalContainer.className = 'flmngr-modal visible'

		// Задаем размеры из опций
		const width = this.options.modal?.width || '1000px'
		const height = this.options.modal?.height || '600px'

		// Создаем содержимое модального окна
		modalContainer.innerHTML = `
			<div class="flmngr-modal-content" style="width: ${width}; height: ${height};">
				<div class="flmngr-modal-header">
					<div class="flmngr-modal-title">Файловый менеджер</div>
					<button class="flmngr-modal-close">
						<span class="material-icons flmngr-icon">close</span>
					</button>
				</div>
				<div class="flmngr-modal-body"></div>
				<div class="flmngr-modal-footer">
					<button class="flmngr-btn flmngr-btn-secondary flmngr-cancel-btn">Отмена</button>
					<button class="flmngr-btn flmngr-btn-primary flmngr-select-btn" disabled>Выбрать файлы</button>
				</div>
			</div>
		`

		// Добавляем окно в DOM
		document.body.appendChild(modalContainer)

		// Находим элементы для управления
		const modalBody = modalContainer.querySelector(
			'.flmngr-modal-body'
		) as HTMLElement
		const closeBtn = modalContainer.querySelector(
			'.flmngr-modal-close'
		) as HTMLElement
		const cancelBtn = modalContainer.querySelector(
			'.flmngr-cancel-btn'
		) as HTMLElement
		const selectBtn = modalContainer.querySelector(
			'.flmngr-select-btn'
		) as HTMLElement

		// Создаем браузер в теле модального окна
		this.initBrowser(modalBody)

		// Добавляем обработчики кнопок
		closeBtn.addEventListener('click', () => this.handleCancel(modalContainer))
		cancelBtn.addEventListener('click', () => this.handleCancel(modalContainer))
		selectBtn.addEventListener('click', () => this.handleFinish(modalContainer))

		// Закрытие по клику на фон
		modalContainer.addEventListener('click', e => {
			if (e.target === modalContainer) {
				this.handleCancel(modalContainer)
			}
		})

		// Закрытие по Escape
		const escHandler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				this.handleCancel(modalContainer)
				document.removeEventListener('keydown', escHandler)
			}
		}
		document.addEventListener('keydown', escHandler)
	}

	/**
	 * Инициализирует браузер файлов
	 */
	private initBrowser(container: HTMLElement): void {
		// Создаем браузер файлов
		this.browser = new FileBrowser(container, this.options.initialPath)

		// Настраиваем параметры браузера
		if (this.options.maxFiles) {
			this.browser.setMaxFiles(this.options.maxFiles)
		}

		if (this.options.allowedTypes) {
			this.browser.setAllowedTypes(this.options.allowedTypes)
		}

		// Устанавливаем обработчик выбора файлов
		this.browser.setOnSelectionChange(files => {
			this.selectedFiles = files
			this.updateSelectButton()
		})
	}

	/**
	 * Обновляет состояние кнопки "Выбрать"
	 */
	private updateSelectButton(): void {
		const selectBtn = document.querySelector(
			'.flmngr-select-btn'
		) as HTMLButtonElement
		if (selectBtn) {
			selectBtn.disabled = this.selectedFiles.length === 0
		}
	}

	/**
	 * Обрабатывает нажатие на кнопку "Отмена"
	 */
	private handleCancel(modalContainer: HTMLElement): void {
		// Удаляем модальное окно
		document.body.removeChild(modalContainer)

		// Сбрасываем состояние
		this.close()

		// Вызываем обработчик отмены
		if (this.options.onCancel) {
			this.options.onCancel()
		}
	}

	/**
	 * Обрабатывает нажатие на кнопку "Выбрать"
	 */
	private handleFinish(modalContainer: HTMLElement): void {
		// Сохраняем выбранные файлы
		const selectedFiles = [...this.selectedFiles]

		// Удаляем модальное окно
		document.body.removeChild(modalContainer)

		// Сбрасываем состояние
		this.close()

		// Вызываем обработчик выбора файлов
		if (this.options.onFinish) {
			this.options.onFinish(selectedFiles)
		}
	}

	/**
	 * Статический метод для быстрого открытия файлового менеджера
	 */
	public static open(options: FlmngrOptions = {}): Flmngr {
		const instance = new Flmngr(options)
		instance.open()
		return instance
	}
}
