import { EventEmitter } from '../utils/EventEmitter'

/**
 * Компонент боковой панели файлового менеджера
 */
export class Sidebar {
	private container: HTMLElement
	private sidebarElement: HTMLElement
	private events: EventEmitter = new EventEmitter()
	private activePath: string = '/'

	/**
	 * Создает боковую панель
	 * @param container контейнер для отображения
	 */
	constructor(container: HTMLElement) {
		this.container = container
		this.sidebarElement = document.createElement('div')
		this.sidebarElement.className = 'silex-sidebar'
		this.container.appendChild(this.sidebarElement)

		this.renderSidebar()
		this.setupEventListeners()
	}

	/**
	 * Отрисовывает боковую панель
	 */
	private renderSidebar(): void {
		this.sidebarElement.innerHTML = `
      <div class="silex-sidebar-item active" data-path="/">
        <i class="material-icons">home</i>
        Все файлы
      </div>
      
      <div class="silex-sidebar-item" data-path="/images">
        <i class="material-icons">image</i>
        Изображения
      </div>
      
      <div class="silex-sidebar-item" data-path="/documents">
        <i class="material-icons">description</i>
        Документы
      </div>
      
      <div class="silex-sidebar-item" data-path="/videos">
        <i class="material-icons">videocam</i>
        Видео
      </div>
      
      <div class="silex-sidebar-item" data-path="/audio">
        <i class="material-icons">audiotrack</i>
        Аудио
      </div>
      
      <div class="silex-sidebar-item" data-path="/trash">
        <i class="material-icons">delete</i>
        Корзина
      </div>
    `
	}

	/**
	 * Настраивает обработчики событий
	 */
	private setupEventListeners(): void {
		const sidebarItems = this.sidebarElement.querySelectorAll(
			'.silex-sidebar-item'
		)
		sidebarItems.forEach(item => {
			item.addEventListener('click', () => {
				// Получаем путь из атрибута
				const path = item.getAttribute('data-path') || '/'

				// Изменяем активный элемент
				sidebarItems.forEach(i => i.classList.remove('active'))
				item.classList.add('active')

				this.activePath = path

				// Уведомляем о смене директории
				this.events.emit('pathChange', path)
			})
		})
	}

	/**
	 * Устанавливает активный путь
	 * @param path путь для активации
	 */
	public setActivePath(path: string): void {
		this.activePath = path

		// Обновляем UI
		const sidebarItems = this.sidebarElement.querySelectorAll(
			'.silex-sidebar-item'
		)
		sidebarItems.forEach(item => {
			const itemPath = item.getAttribute('data-path') || '/'
			if (itemPath === path) {
				item.classList.add('active')
			} else {
				item.classList.remove('active')
			}
		})
	}

	/**
	 * Возвращает активный путь
	 */
	public getActivePath(): string {
		return this.activePath
	}

	/**
	 * Устанавливает обработчик изменения пути
	 */
	public onPathChange(callback: (path: string) => void): void {
		this.events.on('pathChange', callback)
	}
}
