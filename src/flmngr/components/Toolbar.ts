import { EventEmitter } from '../utils/EventEmitter'

/**
 * Компонент панели инструментов файлового менеджера
 */
export class Toolbar {
	private container: HTMLElement
	private toolbarElement: HTMLElement
	private searchInput: HTMLInputElement
	private events: EventEmitter = new EventEmitter()

	/**
	 * Создает панель инструментов
	 * @param container контейнер для отображения
	 */
	constructor(container: HTMLElement) {
		this.container = container
		this.toolbarElement = document.createElement('div')
		this.toolbarElement.className = 'flmngr-header'
		this.container.appendChild(this.toolbarElement)

		this.renderToolbar()

		// Находим элементы для дальнейшего использования
		this.searchInput = this.toolbarElement.querySelector(
			'.flmngr-search'
		) as HTMLInputElement

		this.setupEventListeners()
	}

	/**
	 * Отрисовывает панель инструментов
	 */
	private renderToolbar(): void {
		this.toolbarElement.innerHTML = `
      <div class="flmngr-logo">
        <span class="material-icons flmngr-icon">folder</span>
        Файловый менеджер
      </div>
      
      <div class="flmngr-search-container">
        <span class="material-icons flmngr-icon">search</span>
        <input type="text" class="flmngr-search" placeholder="Поиск файлов...">
      </div>
      
      <div class="flmngr-actions">
        <button class="flmngr-btn flmngr-btn-upload">
          <span class="material-icons flmngr-icon">upload</span>
          Загрузить
        </button>
        
        <button class="flmngr-btn flmngr-btn-primary flmngr-btn-create">
          <span class="material-icons flmngr-icon">create_new_folder</span>
          Создать папку
        </button>
        
        <div class="flmngr-view-toggle">
          <button class="flmngr-view-btn active" data-view="grid">
            <span class="material-icons flmngr-icon">grid_view</span>
          </button>
          <button class="flmngr-view-btn" data-view="list">
            <span class="material-icons flmngr-icon">view_list</span>
          </button>
        </div>
      </div>
    `
	}

	/**
	 * Настраивает обработчики событий
	 */
	private setupEventListeners(): void {
		// Поиск
		this.searchInput.addEventListener('input', e => {
			const searchTerm = (e.target as HTMLInputElement).value
			this.events.emit('search', searchTerm)
		})

		// Кнопка загрузки файлов
		const uploadButton = this.toolbarElement.querySelector('.flmngr-btn-upload')
		if (uploadButton) {
			uploadButton.addEventListener('click', () => {
				this.events.emit('upload')
			})
		}

		// Кнопка создания папки
		const createButton = this.toolbarElement.querySelector('.flmngr-btn-create')
		if (createButton) {
			createButton.addEventListener('click', () => {
				this.events.emit('createFolder')
			})
		}

		// Кнопки переключения вида
		const viewButtons = this.toolbarElement.querySelectorAll('.flmngr-view-btn')
		viewButtons.forEach(button => {
			button.addEventListener('click', () => {
				// Сбрасываем активный класс со всех кнопок
				viewButtons.forEach(btn => btn.classList.remove('active'))

				// Добавляем активный класс текущей кнопке
				button.classList.add('active')

				// Получаем режим отображения
				const viewMode = button.getAttribute('data-view') as 'grid' | 'list'

				// Уведомляем об изменении режима
				this.events.emit('viewChange', viewMode)
			})
		})
	}

	/**
	 * Устанавливает обработчик поиска
	 */
	public onSearch(callback: (searchTerm: string) => void): void {
		this.events.on('search', callback)
	}

	/**
	 * Устанавливает обработчик загрузки файлов
	 */
	public onUpload(callback: () => void): void {
		this.events.on('upload', callback)
	}

	/**
	 * Устанавливает обработчик создания папки
	 */
	public onCreateFolder(callback: () => void): void {
		this.events.on('createFolder', callback)
	}

	/**
	 * Устанавливает обработчик изменения режима отображения
	 */
	public onViewChange(callback: (viewMode: 'grid' | 'list') => void): void {
		this.events.on('viewChange', callback)
	}
}
