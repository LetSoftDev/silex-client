import './scss/main.scss'
import { Flmngr } from './Flmngr'
import { FlmngrOptions } from './models/FileTypes'

// Основные экспорты
export { Flmngr } from './Flmngr'
export { FileBrowser } from './components/FileBrowser'
export { FileList } from './components/FileList'
export { Toolbar } from './components/Toolbar'
export { Sidebar } from './components/Sidebar'
export { Modal } from './components/Modal'

// Экспорт типов
export type {
	FileItem,
	FlmngrOptions,
	FileType,
	DirectoryContents,
	FileOperationResult,
	UploadResult,
} from './models/FileTypes'

// Экспорт утилит
export { FileUtils } from './utils/FileUtils'
export { EventEmitter } from './utils/EventEmitter'
export { FileSystemService } from './services/FileSystemService'

// Утилитарная функция для быстрого открытия файлового менеджера
export function open(options: FlmngrOptions = {}): Flmngr {
	return Flmngr.open(options)
}

// Утилитарная функция для вставки файлового менеджера в DOM
export function embed(selector: string, options: FlmngrOptions = {}): Flmngr {
	return Flmngr.open({
		...options,
		container: selector,
	})
}
