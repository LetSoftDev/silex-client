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
		this.toolbarElement.className = 'silex-header'
		this.container.appendChild(this.toolbarElement)

		this.renderToolbar()

		// Находим элементы для дальнейшего использования
		this.searchInput = this.toolbarElement.querySelector(
			'.silex-search'
		) as HTMLInputElement

		this.setupEventListeners()
	}

	/**
	 * Отрисовывает панель инструментов
	 */
	private renderToolbar(): void {
		this.toolbarElement.innerHTML = `
      <div class="silex-logo">
        <i class="material-icons">folder</i>
        Файловый менеджер
      </div>
      
      <div class="silex-search-container">
        <i class="material-icons silex-search-icon">search</i>
        <input type="text" class="silex-search" placeholder="Поиск файлов...">
      </div>
      
      <div class="silex-actions">
        <button class="silex-btn silex-btn-upload">
          <i class="material-icons">upload</i>
          Загрузить
        </button>
        
        <button class="silex-btn silex-btn-primary silex-btn-create">
          <i class="material-icons">create_new_folder</i>
          Создать папку
        </button>
        
        <div class="silex-view-toggle">
          <button class="silex-view-btn active" data-view="grid">
            <i class="material-icons">grid_view</i>
          </button>
          <button class="silex-view-btn" data-view="list">
            <i class="material-icons">view_list</i>
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
		const uploadButton = this.toolbarElement.querySelector('.silex-btn-upload')
		if (uploadButton) {
			uploadButton.addEventListener('click', () => {
				this.events.emit('upload')
			})
		}

		// Кнопка создания папки
		const createButton = this.toolbarElement.querySelector('.silex-btn-create')
		if (createButton) {
			createButton.addEventListener('click', () => {
				this.events.emit('createFolder')
			})
		}

		// Кнопки переключения вида
		const viewButtons = this.toolbarElement.querySelectorAll('.silex-view-btn')
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
