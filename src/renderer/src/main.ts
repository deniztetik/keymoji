import { init } from '@sentry/electron/renderer'

import categories from '../../../resources/categories.json'

init({
  dsn: 'https://c8d16fe04a7f4361230ce950a160c21e@o271079.ingest.us.sentry.io/4506888948219904'
})

const recentEmojisKey = 'recentEmojis'
const maxRecentEmojis = 20

// Function to save recently used emoji
function saveRecentEmoji(emoji: string) {
  const recentEmojis = getRecentEmojis()
  const newRecentEmojis = [emoji, ...recentEmojis.filter((e) => e !== emoji)].slice(
    0,
    maxRecentEmojis
  )
  localStorage.setItem(recentEmojisKey, JSON.stringify(newRecentEmojis))
}

// Function to get recently used emojis
function getRecentEmojis(): string[] {
  const recentEmojisJSON = localStorage.getItem(recentEmojisKey)
  return recentEmojisJSON ? JSON.parse(recentEmojisJSON) : []
}

// Function to update the recently used emoji section
function updateRecentEmojisSection() {
  const recentEmojisGrid = document.getElementById('recent-emojis')!
  recentEmojisGrid.innerHTML = '' // Clear existing emojis

  getRecentEmojis().forEach((emoji) => {
    const emojiElement = document.createElement('button')
    emojiElement.textContent = emoji
    emojiElement.className = 'emoji'
    emojiElement.addEventListener('click', () => {
      saveRecentEmoji(emoji) // Save the clicked emoji as a recent emoji
      navigator.clipboard.writeText(emoji).then(() => {
        window.close()
      })
    })

    recentEmojisGrid.appendChild(emojiElement)
  })
}

document.addEventListener('DOMContentLoaded', () => {
  const pickerContainer = document.createElement('div')
  pickerContainer.id = 'emojiPicker'
  pickerContainer.style.display = 'flex'
  pickerContainer.style.flexDirection = 'column'
  pickerContainer.style.maxWidth = '600px'
  pickerContainer.style.margin = 'auto'
  pickerContainer.style.padding = '10px'
  pickerContainer.style.overflowY = 'auto'

  const quitButton = document.createElement('button')
  quitButton.textContent = 'Quit'
  quitButton.id = 'quitButton'
  quitButton.style.position = 'absolute'
  quitButton.style.top = '5px'
  quitButton.style.right = '5px'
  quitButton.style.padding = '5px 10px'
  quitButton.addEventListener('click', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ipcRenderer } = require('electron')
    ipcRenderer.send('quit-app')
    setTimeout(window.close, 10) // This should close the emoji picker window
  })

  const recentEmojisHeader = document.createElement('h2')
  recentEmojisHeader.textContent = 'Recently Used'
  recentEmojisHeader.style.textAlign = 'center'

  const recentEmojisGrid = document.createElement('div')
  recentEmojisGrid.id = 'recent-emojis'
  recentEmojisGrid.style.display = 'grid'
  recentEmojisGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(40px, 1fr))'
  recentEmojisGrid.style.gap = '5px'
  recentEmojisGrid.style.padding = '10px'

  // Append the "Recently Used" section first
  pickerContainer.appendChild(recentEmojisHeader)
  pickerContainer.appendChild(recentEmojisGrid)

  Object.entries(categories.emojis).forEach(([categoryName, emojis]) => {
    const categoryHeader = document.createElement('h2')
    categoryHeader.textContent = categoryName
    categoryHeader.style.textAlign = 'center'

    const emojiGrid = document.createElement('div')
    emojiGrid.style.display = 'grid'
    emojiGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(40px, 1fr))'
    emojiGrid.style.gap = '5px'
    emojiGrid.style.padding = '10px'

    Object.values(emojis)
      .flatMap((arr) => arr)
      .forEach((emoji) => {
        const emojiElement = document.createElement('button')
        emojiElement.textContent = emoji.emoji
        emojiElement.className = 'emoji'
        emojiElement.style.fontSize = '24px'
        emojiElement.style.cursor = 'pointer'
        emojiElement.style.border = 'none'
        emojiElement.addEventListener('click', () => {
          saveRecentEmoji(emoji.emoji) // Save as a recent emoji
          updateRecentEmojisSection() // Update the recent emojis section
          navigator.clipboard.writeText(emoji.emoji).then(() => {
            setTimeout(window.close, 10)
          })
        })

        emojiGrid.appendChild(emojiElement)
      })

    pickerContainer.appendChild(categoryHeader)
    pickerContainer.appendChild(emojiGrid)
  })

  pickerContainer.appendChild(quitButton)

  document.body.appendChild(pickerContainer)
  // Initially populate the recent emojis section
  updateRecentEmojisSection()
})

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    // Assuming 'window' is your BrowserWindow instance
    window.close() // Close the current window
  }
})

const fontLink = document.createElement('link')
fontLink.href = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap'
fontLink.rel = 'stylesheet'
document.head.appendChild(fontLink)
