import TrieSearch from 'trie-search'

import categories from '../../../resources/categories.json'

type Emoji = {
  name: string // Example property
  emoji: string // Example property
  // Add more as needed, inferred as necessary
}

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

let trie = new TrieSearch<Emoji>('name')

const recentEmojisKey = 'recentEmojis'
const maxRecentEmojis = 20

// Modify the function to accept an emoji object containing both character and name
function saveRecentEmoji(emoji: { emoji: string; name: string }) {
  const recentEmojis = getRecentEmojis()
  // Check if the emoji already exists based on its character to avoid duplicates
  const newRecentEmojis = [emoji, ...recentEmojis.filter((e) => e.emoji !== emoji.emoji)].slice(
    0,
    maxRecentEmojis
  )
  localStorage.setItem(recentEmojisKey, JSON.stringify(newRecentEmojis))
}

// Adjust the return type to reflect the new data structure
function getRecentEmojis(): { emoji: string; name: string }[] {
  const recentEmojisJSON = localStorage.getItem(recentEmojisKey)
  return recentEmojisJSON ? JSON.parse(recentEmojisJSON) : []
}

// Function to update the recently used emoji section
function updateRecentEmojisSection() {
  const recentEmojisGrid = document.getElementById('recent-emojis')!
  recentEmojisGrid.innerHTML = '' // Clear existing emojis

  getRecentEmojis().forEach((emoji) => {
    const emojiElement = document.createElement('button')
    emojiElement.textContent = emoji.emoji
    emojiElement.dataset.name = emoji.name
    emojiElement.className = 'emoji visible-emoji'
    emojiElement.addEventListener('click', () => {
      saveRecentEmoji(emoji) // Save the clicked emoji as a recent emoji
      navigator.clipboard.writeText(emoji.emoji).then(() => {
        setTimeout(window.close, 10)
      })
    })

    recentEmojisGrid.appendChild(emojiElement)
  })
}

function updateCategoryHeaders(categoryVisibility) {
  categoryVisibility.forEach((isVisible, categoryName) => {
    const header = document.getElementById(`header-${categoryName}`) // Assuming you have an ID like this
    if (header) {
      header.style.display = isVisible ? '' : 'none'
    }
  })
}

function filterEmojis(searchTerm: string) {
  const categoryVisibility = new Map() // Track visibility for each category

  if (searchTerm === '') {
    // If the search term is empty, make all emojis visible
    requestAnimationFrame(() => {
      emojiElementMap.forEach((emoji) => {
        emoji.classList.add('visible-emoji')
        emoji.classList.remove('hidden-emoji')
        // Assuming each emoji element has a data-category attribute
        categoryVisibility.set(emoji.dataset.category, true)
      })
    })
    // Update category headers based on visibility
    updateCategoryHeaders(categoryVisibility)
    document.querySelectorAll('h2').forEach((item) => (item.style.display = ''))

    return
  }

  const matchedEmojis = trie.search(searchTerm.toLowerCase())

  const matchedNames = new Set(matchedEmojis.map((emoji) => emoji.name.toLowerCase()))

  requestAnimationFrame(() => {
    emojiElementMap.forEach((emoji, name) => {
      const isVisible = matchedNames.has(name)
      emoji.classList.toggle('visible-emoji', isVisible)
      emoji.classList.toggle('hidden-emoji', !isVisible)
      const category = emoji.dataset.category
      if (isVisible) {
        categoryVisibility.set(category, true)
      } else if (!categoryVisibility.has(category)) {
        categoryVisibility.set(category, false)
      }
    })
    // Update category headers based on visibility
    updateCategoryHeaders(categoryVisibility)
  })
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
    categoryHeader.id = `header-${categoryName}` // Ensure this matches what `updateCategoryHeaders` expects
    categoryHeader.textContent = categoryName
    categoryHeader.style.textAlign = 'center'

    const emojiGrid = document.createElement('div')
    emojiGrid.className = 'emojiGrid'

    Object.values(emojis)
      .flatMap((arr) => arr)
      .forEach((emoji) => {
        trie.map(emoji.name, emoji)
        console.log('+++emoji', emoji)
        const emojiElement = document.createElement('button')
        emojiElement.textContent = emoji.emoji
        emojiElement.dataset.name = emoji.name // When populating the emojis initially
        emojiElement.dataset.category = categoryName
        emojiElement.className = 'emoji visible-emoji'
        emojiElement.addEventListener('click', () => {
          saveRecentEmoji(emoji) // Save as a recent emoji
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
