import { EventEmitter } from '../utils/EventEmitter'

/**
 * Опции для модального окна
 */
export interface ModalOptions {
	/**
	 * Закрывать модальное окно при клике на оверлей
	 */
	closeOnOverlayClick?: boolean

	/**
	 * Ширина модального окна
	 */
	width?: string

	/**
	 * Высота модального окна
	 */
	height?: string
}

/**
 * Компонент модального окна файлового менеджера
 */
export class Modal {
	private modalElement: HTMLElement
	private bodyElement: HTMLElement
	private closeButton: HTMLElement
	private cancelButton: HTMLElement
	private confirmButton: HTMLButtonElement
	private events: EventEmitter = new EventEmitter()
	private documentKeyHandler: (e: KeyboardEvent) => void
	private options: ModalOptions = {
		closeOnOverlayClick: true,
	}

	/**
	 * Создает модальное окно
	 */
	constructor(options?: Partial<ModalOptions>) {
		// Объединяем переданные опции с опциями по умолчанию
		this.options = { ...this.options, ...options }

		// Создаем DOM структуру
		this.modalElement = document.createElement('div')
		this.modalElement.className = 'silex-modal'

		this.modalElement.innerHTML = `
      <div class="silex-modal-content" style="width: ${this.options.width}; height: ${this.options.height};">
        <div class="silex-modal-header">
          <div class="silex-modal-title">Файловый менеджер</div>
          <button class="silex-modal-close">
            <i class="material-icons">close</i>
          </button>
        </div>
        <div class="silex-modal-body"></div>
        <div class="silex-modal-footer">
          <button class="silex-btn silex-btn-secondary silex-cancel-btn">Отмена</button>
          <button class="silex-btn silex-btn-primary silex-select-btn" disabled>Выбрать файлы</button>
        </div>
      </div>
    `

		this.bodyElement = this.modalElement.querySelector(
			'.silex-modal-body'
		) as HTMLElement
		this.closeButton = this.modalElement.querySelector(
			'.silex-modal-close'
		) as HTMLElement
		this.cancelButton = this.modalElement.querySelector(
			'.silex-cancel-btn'
		) as HTMLElement
		this.confirmButton = this.modalElement.querySelector(
			'.silex-select-btn'
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
		document.body.appendChild(this.modalElement)
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
		this.modalElement.addEventListener('click', e => {
			if (e.target === this.modalElement) {
				this.events.emit('cancel')
				this.hide()
			}
		})
	}

	/**
	 * Возвращает DOM элемент модального окна
	 */
	public getElement(): HTMLElement {
		return this.modalElement
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
			this.modalElement.classList.add('visible')

			// Добавляем обработчик клавиатуры при показе модального окна
			document.addEventListener('keydown', this.documentKeyHandler)
		}, 10)
	}

	/**
	 * Скрывает модальное окно
	 */
	public hide(): void {
		this.modalElement.classList.remove('visible')

		// Удаляем обработчик клавиатуры при скрытии модального окна
		document.removeEventListener('keydown', this.documentKeyHandler)

		setTimeout(() => {
			if (this.modalElement.parentNode) {
				document.body.removeChild(this.modalElement)
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
