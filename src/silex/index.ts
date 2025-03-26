import './scss/main.scss'
import { Silex } from './Silex'
import { SilexOptions } from './models/FileTypes'

// Основные экспорты
export { Silex } from './Silex'
export { FileBrowser } from './components/FileBrowser'
export { FileList } from './components/FileList'
export { Toolbar } from './components/Toolbar'
export { Sidebar } from './components/Sidebar'
export { Modal } from './components/Modal'

// Экспорт типов
export type {
	FileItem,
	SilexOptions,
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
export function open(options: SilexOptions = {}): Silex {
	return Silex.open(options)
}

// Утилитарная функция для вставки файлового менеджера в DOM
export function embed(selector: string, options: SilexOptions = {}): Silex {
	return Silex.open({
		...options,
		container: selector,
	})
}
