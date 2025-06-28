export const en = {
  login: {
    title: 'DID Sign In',
    description: 'Enter your DID to access the chat',
  },
  logo: 'Nuwa AI',
  home: {
    loading: 'Loading...',
  },
  language: {
    english: 'English',
    chinese: 'Chinese',
  },
  nav: {
    sidebar: {
      new: 'New Chat',
      chat: 'Chat',
      settings: 'Settings',
      search: 'Search',
      capStore: 'Cap Store',
      artifact: 'Files',
      togglePin: 'Pin',
      toggleUnpin: 'Unpin',
    },
    profile: {
      toggleTheme: 'Toggle {{mode}} mode',
      signOut: 'Sign Out',
      clearStorage: 'Clear all storage (for testing)',
    },
    menu: {
      preferences: 'Preferences',
      theme: 'Theme',
      language: 'Language',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
    },
  },
  capStore: {
    title: 'Cap Store',
    description: 'Discover and install capabilities to enhance your experience',
    searchPlaceholder: 'Search caps...',
    tabs: {
      all: 'All Caps',
      development: 'Development',
      design: 'Design',
      analytics: 'Analytics',
      productivity: 'Productivity',
      security: 'Security',
    },
    status: {
      loading: 'Loading caps...',
      fetching: 'Fetching the latest capabilities from the store.',
      error: 'Error loading caps',
      errorDesc: 'Failed to fetch caps. Please try again.',
      tryAgain: 'Try Again',
      noCaps: 'No caps found',
      noCapsDesc: {
        search:
          'Try adjusting your search terms or browse different categories.',
        category: 'No caps available in this category yet.',
      },
    },
    card: {
      update: 'Update Available',
      disabled: 'Disabled',
      installed: 'Installed',
      install: 'Install',
      by: 'by {{author}}',
      version: 'v{{version}}',
      downloads: 'downloads',
      rating: 'rating',
      installDate: 'Installed on {{date}}',
    },
  },
  chatHistory: {
    noChats: 'No chats',
    startConversation: 'Conversations you have will appear here',
    today: 'Today',
    thisWeek: 'This week',
    aWeekAgo: 'A week ago',
    older: 'Older',
    loginToSave: 'Sign in with DID to save chat history!',
  },
  search: {
    searchPlaceholder: 'Search chats, caps, files...',
    noChatsHistory: 'No chat history found.',
  },
  chat: {
    restoreVersion: 'Restore this version',
    backToLatest: 'Back to latest',
    viewingPrevious: 'Viewing previous version',
    restoreToEdit: 'Restore this version to edit',
    loadingChat: 'Loading chat...',
  },
  error: {
    info: 'Info',
    warning: 'Warning',
    error: 'Error',
    critical: 'Critical Error',
    network:
      'Network connection failed. Please check your internet connection.',
    api: 'Service is temporarily unavailable. Please try again later.',
    storage:
      'Unable to save data locally. Please check your browser storage settings.',
    validation: 'Invalid input. Please check your data and try again.',
    permission: 'Permission denied. Please check your access rights.',
    notFound: 'The requested {{resource}} was not found.',
    timeout: '{{operation}} timed out. Please try again.',
    generic: 'An unexpected error occurred. Please try again.',
    tryAgain: 'An error occurred. Please try again.',
    persist:
      'If the problem persists, please check your internet connection or reload the page.',
  },
  errors: {
    database: 'An error occurred while executing the database query.',
    badRequestApi:
      'Unable to process the request. Please check your input and try again.',
    unauthorizedAuth: 'You need to sign in before you can continue.',
    forbiddenAuth: 'Your account does not have access to this feature.',
    rateLimitChat:
      'You have exceeded the maximum number of messages for today. Please try again later.',
    notFoundChat:
      'The requested chat was not found. Please check the chat ID and try again.',
    forbiddenChat:
      'This chat belongs to another user. Please check the chat ID and try again.',
    unauthorizedChat:
      'You need to sign in to view this chat. Please sign in and try again.',
    offlineChat:
      'There was a problem sending your message. Please check your internet connection and try again.',
    notFoundDocument:
      'The requested document was not found. Please check the document ID and try again.',
    forbiddenDocument:
      'This document belongs to another user. Please check the document ID and try again.',
    unauthorizedDocument:
      'You need to sign in to view this document. Please sign in and try again.',
    badRequestDocument:
      'The request to create or update the document was invalid. Please check your input and try again.',
    default: 'Something went wrong. Please try again later.',
  },
  actions: {
    viewChanges: 'View changes',
    viewPrev: 'View previous version',
    viewNext: 'View next version',
    copy: 'Copy to clipboard',
    copied: 'Copied to clipboard!',
    addPolish: 'Add final polish',
    requestSuggestions: 'Request suggestions',
    delete: 'Delete',
    more: 'More',
  },
  document: {
    creating: 'Creating',
    created: 'Created',
    updating: 'Updating',
    updated: 'Updated',
    addingSuggestions: 'Adding suggestions',
    addedSuggestions: 'Added suggestions',
    viewingNotSupported: 'Viewing files is not supported in shared chats.',
  },
  suggestedActions: [
    {
      title: 'What are the benefits of Next.js',
      label: 'Why use Next.js?',
      action: 'What are the benefits of Next.js?',
    },
    {
      title: 'Explain with code',
      label: 'Dijkstra algorithm',
      action: 'Explain Dijkstra algorithm with code',
    },
    {
      title: 'Draft an essay about',
      label: 'Silicon Valley',
      action: 'Draft an essay about Silicon Valley',
    },
    {
      title: 'San Francisco weather',
      label: 'How is it now?',
      action: 'How is the weather in San Francisco now?',
    },
  ],
  submit: {
    loading: 'Loading',
    submit: 'Submit form',
  },
  greeting: {
    hello: 'Hello!',
    help: 'How can I help you today?',
  },
  version: {
    viewingPrevious: 'Viewing previous version',
    restoreToEdit: 'Restore this version to edit',
    restore: 'Restore this version',
    backToLatest: 'Back to latest',
    failedRestore: 'Failed to restore version',
  },
  artifact: {
    viewChanges: 'View changes',
    viewPrev: 'View previous version',
    viewNext: 'View next version',
    copy: 'Copy to clipboard',
    copied: 'Copied to clipboard!',

    text: {
      description: 'Useful for text content like drafting essays and emails.',
      actions: {
        versionChange: 'View diff',
        undo: 'Undo change',
        redo: 'Redo change',
        copy: 'Copy text',
      },
      addPolish: 'Add final polish',
      requestSuggestions: 'Request suggestions',
      polishPrompt:
        'Please add final polish, check grammar, add section titles to improve structure, and ensure everything flows smoothly.',
      suggestionsPrompt:
        'Please provide suggestions that could improve the writing.',
    },

    code: {
      description:
        'Useful for code generation; code execution is only available for Python code.',
      actions: {
        run: 'Run code',
        undo: 'Undo change',
        redo: 'Redo change',
        copy: 'Copy code',
      },
      run: 'Run',
      executeCode: 'Execute code',
      copyCode: 'Copy code to clipboard',
      addComments: 'Add comments',
      addLogs: 'Add logs',
      addCommentsPrompt: 'Add comments to the code snippet for understanding',
      addLogsPrompt: 'Add logs to the code snippet for debugging',
    },

    sheet: {
      description: 'Useful for working with spreadsheets',
      copyAsCsv: 'Copy as .csv',
      copiedCsv: 'Copied csv to clipboard!',
      formatData: 'Format and clean data',
      analyzeData: 'Analyze and visualize data',
      formatPrompt: 'Could you help format and clean the data?',
      analyzePrompt:
        'Could you analyze and visualize the data by creating a new Python code artifact?',
      actions: {
        undo: 'Undo change',
        redo: 'Redo change',
        copy: 'Copy table as CSV',
      }
    },

    image: {
      description: 'Useful for image generation',
      actions: {
        undo: 'Undo change',
        redo: 'Redo change',
        copy: 'Copy image',
      },
      copyImage: 'Copy image to clipboard',
      copiedImage: 'Copied image to clipboard!',
    },
  },
  documentTool: {
    creating: 'Creating',
    created: 'Created',
    updating: 'Updating',
    updated: 'Updated',
    addingSuggestions: 'Adding suggestions',
    addedSuggestions: 'Added suggestions',
    viewingNotSupported: 'Viewing files is not supported in shared chats.',
  },
  upload: {
    failedCreateUrl: 'Failed to create file URL',
    failedUpload: 'Failed to upload file, please try again!',
    errorUploading: 'Error uploading file!',
  },
  settings: {
    title: 'Settings',
    description: 'Manage your account settings and preferences.',
    sections: {
      profile: {
        title: 'Profile',
        description: 'Manage your profile information',
        subtitle: 'This is the information about your Nuwa assistant.',
      },
      placeholders: {
        title: 'Placeholders',
        description: 'Placeholder for general settings.',
        subtitle: 'This is a placeholder for debugging the settings UI.',
      },
      system: {
        title: 'System',
        description: 'System settings and maintenance',
        subtitle: 'Manage system-level settings and data.',
      },
      general: {
        title: "General",
        subtitle: "General application settings.",
      },
    },
    profile: {
      didInformation: {
        title: 'DID Information',
        description: 'Your decentralized identifier and authentication status',
        did: 'DID',
        notSet: 'Not set',
        authenticated: 'Authenticated',
        notAuthenticated: 'Not authenticated',
        copy: 'Copy',
        copied: 'DID copied to clipboard!',
      },
      photo: {
        title: 'Profile Photo',
        description: 'This will be displayed on your profile.',
        changePhoto: 'Change Photo',
        remove: 'Remove',
        fileTypes: 'JPG, PNG or GIF. Max size 5MB.',
      },
      displayName: {
        title: 'Display Name',
        description: 'This is your public display name.',
        name: 'Name',
        placeholder: 'Enter your name',
        save: 'Save',
      },
    },
    system: {
      clearAllStorage: {
        title: 'Clear All Storage',
        description:
          'Permanently delete all stored data including chats, settings, and files',
        warning: 'Warning: This action cannot be undone',
        warningDescription:
          'This will permanently delete all your data including chat history, settings, uploaded files, and documents. You will need to sign in again.',
        button: 'Clear All Data',
        confirmTitle: 'Are you absolutely sure?',
        confirmDescription:
          'This action cannot be undone. This will permanently delete all of your data:',
        confirmButton: 'Yes, clear everything',
        cancel: 'Cancel',
        clearing: 'Clearing...',
        success: 'All storage has been cleared successfully',
        error: 'Failed to clear storage. Please try again.',
        dataTypes: {
          chats: 'All chat conversations and history',
          settings: 'User preferences and settings',
          files: 'Uploaded files and attachments',
          documents: 'Created documents and artifacts',
        },
      },
      devMode: {
        title: 'Developer Mode',
        description: 'Enable or disable developer mode.'
      },
      language: {
        title: 'Language',
        description: 'Select your preferred language.'
      }
    },
  },
};
