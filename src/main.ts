import './scss/demo.scss'
import { open, FileItem } from './'

document.addEventListener('DOMContentLoaded', () => {
	// Настраиваем содержимое страницы
	document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
		<div class="demo-container">
			<h1>Файловый менеджер на TypeScript</h1>
			
			<div class="demo-section">
				<h2>Модальный режим</h2>
				<p>Открывает файловый менеджер в модальном окне</p>
				<button id="open-modal" class="demo-button">Открыть модальное окно</button>
			</div>
			
			<div class="demo-section">
				<h2>Встроенный режим</h2>
				<p>Файловый менеджер встроен в страницу</p>
				<div id="embedded-manager" class="embedded-container"></div>
			</div>
			
			<div class="demo-section">
				<h2>Выбранные файлы</h2>
				<div id="selected-files" class="selected-files">
					<p>Выберите файлы, используя файловый менеджер</p>
				</div>
			</div>
		</div>
	`

	// Кнопка для открытия модального окна
	const openModalBtn = document.getElementById('open-modal')
	if (openModalBtn) {
		openModalBtn.addEventListener('click', () => {
			console.log('Открываем модальное окно...')
			// Открываем менеджер файлов в модальном режиме
			open({
				maxFiles: 3, // Можно выбрать до 3 файлов
				allowedTypes: ['image', 'document'], // Разрешаем только изображения и документы
				onFinish: (files: FileItem[]) => {
					console.log('Файлы выбраны:', files)
					displaySelectedFiles(files)
				},
				onCancel: () => {
					console.log('Выбор файлов отменен')
				},
			})
		})
	}

	// Встраиваем файловый менеджер на страницу
	const embeddedContainer = document.getElementById('embedded-manager')
	if (embeddedContainer) {
		// Открываем менеджер файлов в встроенном режиме
		open({
			container: '#embedded-manager',
			initialPath: '/',
			maxFiles: 5,
			onFinish: (files: FileItem[]) => {
				displaySelectedFiles(files)
			},
		})
	}

	// Функция для отображения выбранных файлов
	function displaySelectedFiles(files: FileItem[]): void {
		const selectedFilesContainer = document.getElementById('selected-files')
		if (!selectedFilesContainer) return

		if (files.length === 0) {
			selectedFilesContainer.innerHTML = '<p>Файлы не выбраны</p>'
			return
		}

		let html = '<h3>Выбранные файлы:</h3><ul class="files-list">'

		files.forEach(file => {
			let previewHtml = ''

			// Если это изображение и у него есть URL превью
			if (file.type === 'image' && file.thumbnailUrl) {
				previewHtml = `<img src="${file.thumbnailUrl}" alt="${file.name}" class="file-preview">`
			}

			html += `
				<li class="file-item">
					${previewHtml}
					<div class="file-info">
						<div class="file-name">${file.name}</div>
						<div class="file-meta">
							<span class="file-type">${file.type}</span>
							<span class="file-date">${file.modifiedAt.toLocaleString()}</span>
						</div>
					</div>
				</li>
			`
		})

		html += '</ul>'
		selectedFilesContainer.innerHTML = html
	}
})
