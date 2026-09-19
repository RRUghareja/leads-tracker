/** Every piece of text shown to users lives here, grouped by screen. */

export const MESSAGES = {
  APP: {
    TITLE: 'Leads Tracker',
    DESCRIPTION: 'Track leads, their status and the notes your team keeps on them.',
    NAV_LEADS: 'Leads',
    NAV_NEW_LEAD: 'New lead',
    MAIN_NAV_LABEL: 'Main',
  },

  LEADS: {
    TITLE: 'Leads',
    NEW_TITLE: 'New lead',
    EDIT_TITLE: (name: string) => `Edit ${name}`,
    count: (total: number, filtered: boolean) => {
      const noun = total === 1 ? 'lead' : 'leads';
      if (!filtered) return `${total} ${noun} in total`;
      return `${total} ${noun} ${total === 1 ? 'matches' : 'match'} your filters`;
    },
    SEARCH_LABEL: 'Search by name or email',
    SEARCH_PLACEHOLDER: 'Search by name or email',
    FILTER_LABEL: 'Filter by status',
    ALL_STATUSES: 'All statuses',
    UPDATING: 'Updating…',
    CLEAR: 'Clear',
    COLUMNS: {
      NAME: 'Name',
      EMAIL: 'Email',
      PHONE: 'Phone',
      STATUS: 'Status',
      CREATED: 'Created',
      UPDATED: 'Last updated',
    },
    NO_VALUE: '—',
    ACTIONS_HEADING: 'Actions',
    DRAG_HINT:
      'Drag the handle at the start of a row to change the order. Keyboard: focus the handle, press Space, use the arrow keys, then Space again.',
    dragHandleLabel: (name: string) => `Drag to reorder ${name}`,
    REORDER_FAILED: 'Could not save the new order. It has been put back.',
    EMPTY_FILTERED_TITLE: 'No leads match your search',
    EMPTY_FILTERED_HINT: 'Try a different name, email or status.',
    EMPTY_TITLE: 'No leads yet',
    EMPTY_HINT: 'Add your first lead to start tracking it.',
    ADD_FIRST: 'Add your first lead',
  },

  PAGINATION: {
    LABEL: 'Pagination',
    ROWS_PER_PAGE: 'Rows per page',
    CUSTOM_PLACEHOLDER: 'Custom',
    customLabel: (min: number, max: number) => `Type a custom number of rows (${min}–${max})`,
    showing: (first: number, last: number, total: number) => `Showing ${first}–${last} of ${total}`,
    pageOf: (page: number, totalPages: number) => `Page ${page} of ${totalPages}`,
    PREVIOUS: '← Previous',
    NEXT: 'Next →',
  },

  FORM: {
    NAME: 'Name',
    EMAIL: 'Email',
    PHONE: 'Phone (optional)',
    STATUS: 'Status',
    CREATE: 'Create lead',
    SAVE: 'Save changes',
    CANCEL: 'Cancel',
    SAVING: 'Saving…',
    FIX_FIELDS: 'Please fix the highlighted fields.',
  },

  SUMMARY: {
    LABEL: 'Leads by status',
    ALL: 'All leads',
    cardLabel: (name: string, count: number) => `${name}: ${count}`,
  },

  OVERVIEW: {
    CLOSE: 'Close',
    NOTES_LOADING: 'Loading notes…',
    NOTES_FAILED: 'Could not load the notes.',
    RETRY: 'Try again',
  },

  ACTIONS: {
    OVERVIEW: 'Overview',
    EDIT: 'Edit',
    CLONE: 'Clone',
    CLONING: 'Cloning…',
    DELETE: 'Delete',
    DELETING: 'Deleting…',
    overviewLabel: (name: string) => `Overview of ${name}`,
    editLabel: (name: string) => `Edit ${name}`,
    cloneLabel: (name: string) => `Clone ${name}`,
    deleteLabel: (name: string) => `Delete ${name}`,
  },

  DETAIL: {
    BACK: '← All leads',
    EDIT: 'Edit',
    DELETE: 'Delete',
    DELETING: 'Deleting…',
    DETAILS_HEADING: 'Details',
    EMAIL: 'Email',
    PHONE: 'Phone',
    CREATED: 'Created',
    UPDATED: 'Last updated',
    PHONE_EMPTY: 'Not provided',
    UPDATE_STATUS: 'Update',
    UPDATING: 'Updating…',
    confirmDelete: (name: string) =>
      `Delete ${name} and all of their notes? This cannot be undone.`,
  },

  NOTES: {
    TITLE: 'Notes',
    heading: (count: number) => `Notes (${count})`,
    NONE: 'No notes yet.',
    ADD_LABEL: 'Add a note',
    PLACEHOLDER: 'What happened? What is the next step?',
    ADD_BUTTON: 'Add note',
    ADDING: 'Adding…',
    EMPTY: 'No notes yet. Add the first one above.',
  },

  LOGIN: {
    TITLE: 'Sign in',
    SUBTITLE: 'Enter your username and password to open Leads Tracker.',
    USERNAME: 'Username',
    PASSWORD: 'Password',
    SUBMIT: 'Sign in',
    SIGNING_IN: 'Signing in…',
    INVALID: 'Invalid username or password.',
    SIGN_OUT: 'Sign out',
    SIGNING_OUT: 'Signing out…',
    demoHint: (user: string, password: string) => `Demo login: ${user} / ${password}`,
    MISCONFIGURED:
      'Portal login is misconfigured: set both PORTAL_LOGIN_USER and PORTAL_LOGIN_PASSWORD, or neither.',
    UNAUTHENTICATED: 'Authentication required',
  },

  ERRORS: {
    GENERIC_TITLE: 'Something went wrong',
    GENERIC_FALLBACK: 'An unexpected error occurred.',
    TRY_AGAIN: 'Try again',
    PAGE_NOT_FOUND_TITLE: 'Page not found',
    PAGE_NOT_FOUND_TEXT: 'The page you are looking for does not exist or was removed.',
    LEAD_NOT_FOUND_TITLE: 'Lead not found',
    LEAD_NOT_FOUND_TEXT: 'This lead does not exist. It may have been deleted.',
    BACK_TO_LEADS: 'Back to leads',
    apiUnreachable: (url: string) => `Could not reach the API at ${url}`,
    EMPTY_RESPONSE: 'The API returned an empty response',
    UNEXPECTED_RESPONSE: 'Unexpected API response',
  },
} as const;
