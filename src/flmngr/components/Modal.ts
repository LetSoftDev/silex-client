import { EventEmitter } from '../utils/EventEmitter'

/**
 * Компонент модального окна файлового менеджера
 */
export class Modal {
	private element: HTMLElement
	private contentElement: HTMLElement
	private bodyElement: HTMLElement
	private closeButton: HTMLElement
	private cancelButton: HTMLElement
	private confirmButton: HTMLButtonElement
	private events: EventEmitter = new EventEmitter()
	private documentKeyHandler: (e: KeyboardEvent) => void

	/**
	 * Создает модальное окно
	 * @param width ширина модального окна
	 * @param height высота модального окна
	 */
	constructor(width: string = '1000px', height: string = '600px') {
		this.element = document.createElement('div')
		this.element.className = 'flmngr-modal'

		this.element.innerHTML = `
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

		this.contentElement = this.element.querySelector(
			'.flmngr-modal-content'
		) as HTMLElement
		this.bodyElement = this.element.querySelector(
			'.flmngr-modal-body'
		) as HTMLElement
		this.closeButton = this.element.querySelector(
			'.flmngr-modal-close'
		) as HTMLElement
		this.cancelButton = this.element.querySelector(
			'.flmngr-cancel-btn'
		) as HTMLElement
		this.confirmButton = this.element.querySelector(
			'.flmngr-select-btn'
		) as HTMLButtonElement

		// Создаем обработчик для клавиатуры
		this.documentKeyHandler = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				this.events.emit('cancel')
			} else if (e.key === 'Enter' && !this.confirmButton.disabled) {
				this.events.emit('confirm')
			}
		}

		this.setupEventListeners()

		// Добавляем модальное окно в DOM сразу при создании
		document.body.appendChild(this.element)
	}

	/**
	 * Настраивает обработчики событий
	 */
	private setupEventListeners(): void {
		// Закрытие по клику на кнопку закрытия
		this.closeButton.addEventListener('click', e => {
			e.preventDefault()
			e.stopPropagation()
			this.events.emit('cancel')
			this.hide()
		})

		// Закрытие по клику на кнопку отмены
		this.cancelButton.addEventListener('click', e => {
			e.preventDefault()
			e.stopPropagation()
			this.events.emit('cancel')
			this.hide()
		})

		// Подтверждение по клику на кнопку выбора
		this.confirmButton.addEventListener('click', e => {
			e.preventDefault()
			e.stopPropagation()
			this.events.emit('confirm')
			this.hide()
		})

		// Закрытие по клику на фон
		this.element.addEventListener('click', e => {
			if (e.target === this.element) {
				this.events.emit('cancel')
				this.hide()
			}
		})
	}

	/**
	 * Возвращает DOM элемент модального окна
	 */
	public getElement(): HTMLElement {
		return this.element
	}

	/**
	 * Возвращает DOM элемент тела модального окна
	 */
	public getBodyElement(): HTMLElement {
		return this.bodyElement
	}

	/**
	 * Обновляет состояние кнопки подтверждения
	 */
	public setConfirmEnabled(enabled: boolean): void {
		this.confirmButton.disabled = !enabled
	}

	/**
	 * Показывает модальное окно
	 */
	public show(): void {
		setTimeout(() => {
			this.element.classList.add('visible')

			// Добавляем обработчик клавиатуры при показе модального окна
			document.addEventListener('keydown', this.documentKeyHandler)
		}, 10)
	}

	/**
	 * Скрывает модальное окно
	 */
	public hide(): void {
		this.element.classList.remove('visible')

		// Удаляем обработчик клавиатуры при скрытии модального окна
		document.removeEventListener('keydown', this.documentKeyHandler)

		setTimeout(() => {
			if (this.element.parentNode) {
				document.body.removeChild(this.element)
			}
		}, 200)
	}

	/**
	 * Устанавливает обработчик отмены
	 */
	public onCancel(callback: () => void): void {
		this.events.on('cancel', callback)
	}

	/**
	 * Устанавливает обработчик подтверждения
	 */
	public onConfirm(callback: () => void): void {
		this.events.on('confirm', callback)
	}
}
