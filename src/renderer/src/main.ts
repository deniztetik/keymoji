import emojiCategories from './emojiCategories'

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
    window.close() // This should close the emoji picker window
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ipcRenderer } = require('electron')
    ipcRenderer.send('quit-app')
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

  Object.entries(emojiCategories).forEach(([categoryName, emojis]) => {
    const categoryHeader = document.createElement('h2')
    categoryHeader.textContent = categoryName
    categoryHeader.style.textAlign = 'center'

    const emojiGrid = document.createElement('div')
    emojiGrid.style.display = 'grid'
    emojiGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(40px, 1fr))'
    emojiGrid.style.gap = '5px'
    emojiGrid.style.padding = '10px'

    emojis.forEach((emoji) => {
      const emojiElement = document.createElement('button')
      emojiElement.textContent = emoji
      emojiElement.className = 'emoji'
      emojiElement.style.fontSize = '24px'
      emojiElement.style.cursor = 'pointer'
      emojiElement.style.border = 'none'
      emojiElement.style.background = 'none'
      emojiElement.addEventListener('click', () => {
        saveRecentEmoji(emoji) // Save as a recent emoji
        updateRecentEmojisSection() // Update the recent emojis section
        navigator.clipboard.writeText(emoji).then(() => {
          window.close()
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

const style = document.createElement('style')
style.textContent = `
  #emojiPicker {
    display: flex;
    flex-direction: column;
    max-width: 600px;
    margin: auto;
    padding: 10px;
    overflow-y: auto;
    background: #fff; /* Consider your app's theme */
    border-radius: 8px; /* Rounded corners for the picker */
    box-shadow: 0 2px 4px rgba(0,0,0,0.1); /* Soft shadow for depth */
  }

  #emojiPicker h2 {
    text-align: center;
    font-family: 'Open Sans', 'Arial', sans-serif;
    font-size: 1.2rem;
    color: #333; /* Subdued text color for headers */
    margin-top: 20px;
    margin-bottom: 10px;
    padding: 0 10px;
  }

  #emojiPicker .emoji {
    font-size: 24px;
    cursor: pointer;
    border: none;
    background: none;
    padding: 5px;
    border-radius: 5px; /* Slightly rounded edges for emoji buttons */
    transition: background-color 0.3s ease; /* Smooth transition for hover effect */
  }

  #emojiPicker .emoji:hover {
    background-color: #f0f0f0; /* Light grey background on hover */
  }

  #emojiPicker div {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 5px;
    padding: 10px;
  }

  #quitButton {
    background-color: #ff453a; /* macOS-style quit button color */
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
  }

  #quitButton:hover {
    background-color: #bf3325;
  }
`
document.head.appendChild(style)
