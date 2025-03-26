/**
 * Простая реализация паттерна "Наблюдатель" для управления событиями
 */
export class EventEmitter {
	private events: Record<string, Array<(...args: any[]) => void>> = {}

	/**
	 * Подписывается на событие
	 * @param eventName имя события
	 * @param callback функция-обработчик
	 */
	public on(eventName: string, callback: (...args: any[]) => void): void {
		if (!this.events[eventName]) {
			this.events[eventName] = []
		}
		this.events[eventName].push(callback)
	}

	/**
	 * Отписывается от события
	 * @param eventName имя события
	 * @param callback функция-обработчик
	 */
	public off(eventName: string, callback: (...args: any[]) => void): void {
		if (!this.events[eventName]) {
			return
		}
		this.events[eventName] = this.events[eventName].filter(
			cb => cb !== callback
		)
	}

	/**
	 * Генерирует событие с опциональными аргументами
	 * @param eventName имя события
	 * @param args аргументы для передачи обработчикам
	 */
	public emit(eventName: string, ...args: any[]): void {
		if (!this.events[eventName]) {
			return
		}
		this.events[eventName].forEach(callback => {
			callback(...args)
		})
	}

	/**
	 * Очищает все обработчики для указанного события
	 * @param eventName имя события
	 */
	public clear(eventName?: string): void {
		if (eventName) {
			delete this.events[eventName]
		} else {
			this.events = {}
		}
	}
}
