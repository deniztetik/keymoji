import categories from '../../../resources/categories.json'

function debounce(func, wait) {
  let timeout

  function debounced(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }

  debounced.cancel = function () {
    clearTimeout(timeout)
  }

  return debounced
}

const recentEmojisKey = 'recentEmojis'
const maxRecentEmojis = 20

// Modify the function to accept an emoji object containing both character and name
function saveRecentEmoji(emoji: { character: string; name: string }) {
  const recentEmojis = getRecentEmojis()
  // Check if the emoji already exists based on its character to avoid duplicates
  const newRecentEmojis = [
    emoji,
    ...recentEmojis.filter((e) => e.character !== emoji.character)
  ].slice(0, maxRecentEmojis)
  localStorage.setItem(recentEmojisKey, JSON.stringify(newRecentEmojis))
}

// Adjust the return type to reflect the new data structure
function getRecentEmojis(): { character: string; name: string }[] {
  const recentEmojisJSON = localStorage.getItem(recentEmojisKey)
  return recentEmojisJSON ? JSON.parse(recentEmojisJSON) : []
}

// Function to update the recently used emoji section
function updateRecentEmojisSection() {
  const recentEmojisGrid = document.getElementById('recent-emojis')!
  recentEmojisGrid.innerHTML = '' // Clear existing emojis

  getRecentEmojis().forEach((emoji) => {
    const emojiElement = document.createElement('button')
    emojiElement.textContent = emoji.character
    emojiElement.dataset.name = emoji.name
    emojiElement.className = 'emoji visible-emoji'
    emojiElement.addEventListener('click', () => {
      saveRecentEmoji(emoji) // Save the clicked emoji as a recent emoji
      navigator.clipboard.writeText(emoji.character).then(() => {
        window.close()
      })
    })

    recentEmojisGrid.appendChild(emojiElement)
  })
}

function filterEmojis(searchTerm: string) {
  console.log('++emojiElementMap', emojiElementMap)
  searchTerm = searchTerm.toLowerCase() // Ensure the search term is lowercase for case-insensitive comparison
  const emojis = Array.from(emojiElementMap.values()) // Get all emoji elements from the map
  const batchSize = 20 // Determine an appropriate batch size

  function updateVisibilityForBatch(batch) {
    requestAnimationFrame(() => {
      for (let emoji of batch) {
        console.log('+++emoji', emoji)
        const isVisible = emoji.dataset.name.toLowerCase().includes(searchTerm)
        emoji.classList.toggle('visible-emoji', isVisible)
        emoji.classList.toggle('hidden-emoji', !isVisible)
      }
    })
  }

  // Function to process emojis in batches
  function processInBatches(allEmojis, index = 0) {
    if (index >= allEmojis.length) return // Base case: done processing

    const batch = allEmojis.slice(index, index + batchSize)
    updateVisibilityForBatch(batch) // Update visibility for current batch

    // Schedule next batch
    requestAnimationFrame(() => processInBatches(allEmojis, index + batchSize))
  }

  // Start processing in batches
  processInBatches(emojis)
}

let emojiElementMap = new Map()

document.addEventListener('DOMContentLoaded', () => {
  // Create search bar container
  const searchBarContainer = document.createElement('div')
  searchBarContainer.id = 'searchBarContainer'

  // Create search input
  const searchInput = document.createElement('input')
  searchInput.type = 'text'
  searchInput.id = 'searchInput'
  searchInput.placeholder = 'Search emojis...'

  const debouncedFilterEmojis = debounce(() => {
    const searchTerm = searchInput.value.toLowerCase()
    filterEmojis(searchTerm)
  }, 300)

  searchInput.addEventListener('input', () => {
    debouncedFilterEmojis.cancel() // Cancel previous debounce if still waiting
    debouncedFilterEmojis() // Apply debounced filtering
  })

  // Append the search input to the search bar container
  searchBarContainer.appendChild(searchInput)

  const pickerContainer = document.createElement('div')
  pickerContainer.id = 'emojiPicker'

  // Append the search bar container to the picker container before the recent emojis section
  pickerContainer.insertBefore(searchBarContainer, pickerContainer.firstChild)

  const quitButton = document.createElement('button')
  quitButton.textContent = 'Quit'
  quitButton.id = 'quitButton'
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

  // Append the "Recently Used" section first
  pickerContainer.appendChild(recentEmojisHeader)
  pickerContainer.appendChild(recentEmojisGrid)

  Object.entries(categories.emojis).forEach(([categoryName, emojis]) => {
    const categoryHeader = document.createElement('h2')
    categoryHeader.textContent = categoryName
    categoryHeader.style.textAlign = 'center'

    const emojiGrid = document.createElement('div')
    emojiGrid.className = 'emojiGrid'

    Object.values(emojis)
      .flatMap((arr) => arr)
      .forEach((emoji) => {
        // console.log('+++emoji', emoji.emoji, emoji.name)
        const emojiElement = document.createElement('button')
        emojiElement.textContent = emoji.emoji
        emojiElement.dataset.name = emoji.name // When populating the emojis initially
        emojiElement.className = 'emoji visible-emoji'
        emojiElement.addEventListener('click', () => {
          saveRecentEmoji(emoji.emoji) // Save as a recent emoji
          updateRecentEmojisSection() // Update the recent emojis section
          navigator.clipboard.writeText(emoji.emoji).then(() => {
            setTimeout(window.close, 10)
          })
        })

        emojiElementMap.set(emoji.name.toLowerCase(), emojiElement)

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

import('@sentry/electron/renderer').then(({ init }) => {
  init({
    dsn: 'https://c8d16fe04a7f4361230ce950a160c21e@o271079.ingest.us.sentry.io/4506888948219904'
  })
})
