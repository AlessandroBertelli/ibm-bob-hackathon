/**
 * English UI strings. Single file so translations are easy to find and update.
 */

export const t = {
    app: {
        name: 'atavola',
    },
    nav: {
        myFood: 'My Food',
        signOut: 'Sign out',
        signIn: 'Sign in',
        openMenu: 'Open profile menu',
    },
    landing: {
        // Lives outside the sign-in card, directly below the logo. One
        // tagline for the whole page; the card no longer carries its own
        // subheading.
        tagline: 'From a vibe to a menu, together.',
        emailLabel: 'Email address',
        emailPlaceholder: 'you@example.com',
        sendLink: "Let's get food",
        sentTitle: 'Check your inbox',
        sentBody: "We've sent a sign-in link to",
        sentRetry: 'Try another email',
        invalidEmail: 'Please enter a valid email address',
        sendError: "Couldn't send the link. Try again?",
        mockHint: 'Mock mode active — sign-in works without sending an email.',
        // Three vertical pillar rows inside the sign-in card. Bodies are
        // ~2 lines on mobile, telling the app's narrative in three beats:
        // generate → group decides → save what worked. Vocabulary mirrors
        // the rest of the app (cookbook, standings, "the table") so the
        // story closes on the brand.
        pillars: {
            // Title intentionally echoes the slogan "From a vibe to a
            // menu, together." — the only place "vibe" surfaces outside
            // the slogan, by design, to reinforce the same idea.
            vibe: {
                emoji: '🪄',
                title: 'Vibe → Menu',
                body: 'Tell us the mood, the group size, any cravings. Four illustrated meal ideas come back in under a minute — ready to swipe.',
            },
            swipe: {
                emoji: '📱',
                title: 'Swipe to Vote',
                body: 'Share one link — no app to install. The group swipes the cards and the standings update live as picks come in.',
            },
            host: {
                emoji: '🥗',
                title: 'Host with Ease',
                body: 'Heart any meal you love. It lands in your cookbook, ready for the next time you sit down at the table.',
            },
        },
        builtBy: {
            heading: 'Made with ❤️ & 🍕',
            subheading: 'Built at IBM Bobathon Zürich, 30 April 2026, by',
            noLinkYet: 'LinkedIn link to come',
        },
        tech: {
            heading: 'Tech Stack & Status',
            live: 'Live services',
            stack: 'Stack',
            loading: 'Loading status …',
            statusError: 'Could not load status.',
        },
        status: {
            ok: 'Live',
            rateLimited: 'All limits exhausted',
            error: 'All providers failing',
        },
    },
    privacy: {
        cta: 'Privacy & Terms',
        title: 'Privacy & Terms',
        privacyHeading: 'Privacy',
        privacyBody:
            '100% free, non-commercial open-source study project. No monetisation, no advertising. We count anonymised visits and sign-ins for internal statistics — no cookies, no fingerprinting, no sharing with third parties.',
        termsHeading: 'Use',
        // Single sentence — the previous second paragraph duplicated
        // `privacyBody` above. (Audit / landing-redesign cleanup.)
        termsBody:
            'Free to use. On abuse (spam, automated requests, content violations) access is blocked.',
        contactHeading: 'Contact',
    },
    account: {
        delete: 'Delete account',
        confirmTitle: 'Are you sure?',
        confirmBody: 'This cannot be undone.',
        deleted: 'Account deleted.',
    },
    authVerify: {
        verifying: 'Signing you in …',
        successTitle: 'Welcome to the table',
        successBody: 'Just a moment …',
        errorTitle: 'Sign-in failed',
        errorBody: "That link's invalid or expired.",
        backHome: 'Back to home',
    },
    create: {
        title: 'What are we eating?',
        subtitle: "You tell us — we'll bring four ideas.",
        // Form labels read as a short conversation: three questions in a
        // row (What's happening? · How many people? · Any restrictions?),
        // matching the page heading.
        vibeLabel: "What's happening?",
        vibePlaceholder:
            'Cozy movie night with friends · Vegetarian Taco Tuesday · Anniversary dinner',
        vibeError: 'At least 3 characters please',
        headcountLabel: 'How many people?',
        headcountHelper: 'Between 2 and 20',
        headcountError: 'Pick 2 to 20 people.',
        dietaryTitle: 'Any restrictions?',
        vegan: 'Vegan',
        glutenFree: 'Gluten-free',
        // "Cookbook" appears once on this page — here, in the section
        // title — to avoid the three-way repetition that crept in over
        // earlier rounds. The hint and the empty state below refer to it
        // implicitly without saying the word again.
        myFoodTitle: 'Bring favourites from the cookbook',
        myFoodHint: 'Pick up to 4. We do the rest.',
        searchPlaceholder: 'Search meals …',
        emptyMyFood: 'Nothing saved yet — no problem.',
        selectionFull: "Four picked — that's the limit.",
        selectedCount: (n: number) => `${n} / 4 selected`,
        submit: 'Cook up the menu',
        creating: 'Cooking up ideas …',
        createError: "Couldn't cook up the menu. Try again?",
    },
    session: {
        loading: 'Cooking …',
        generating: 'Cooking up your menu …',
        generatingHint: 'Good food takes a moment — 30–60 seconds.',
        title: 'Your menu',
        subtitle: (vibe: string, headcount: number) => `${vibe} • ${headcount} people`,
        createLink: 'Get everyone voting',
        regenerate: 'Shuffle the menu',
        share: {
            title: 'Invite the group',
            description: 'Send this to your group. Anyone with the link can vote.',
            tapToCopy: 'Tap to copy',
            copied: 'Link copied',
            copyError: 'Could not copy',
            shareNative: 'Share …',
            nativeShareText: 'Help me pick a meal',
            qr: 'QR code',
            close: 'Close',
            qrTitle: 'Scan to join the table',
            qrBody: 'Point a phone at this and you’re in.',
            back: 'Back',
        },
    },
    vote: {
        loading: 'Cooking …',
        invalidLinkTitle: 'Invalid link',
        invalidLinkBody: 'That link looks broken or incomplete.',
        notFoundTitle: 'Session not found',
        toHome: 'Back to home',
        progress: 'Progress',
        instructions: 'Swipe or tap — your call.',
        no: 'No',
        yes: 'Si',
        voteError: "Couldn't save your pick. Try again?",
        loadError: 'Loading failed',
        completedTitle: 'All swiped',
        completedBody: 'Your picks are saved. Buon appetito.',
        toResults: 'Show standings',
        skipToResults: 'Show standings',
    },
    results: {
        title: 'Live standings',
        subtitle: 'Re-sorts in real time as picks come in.',
        loading: 'Loading standings …',
        // CTA below the live ranking. Re-voting is silently a no-op server-side
        // (cast_vote dedups), so the link sends signed-in users to their
        // cookbook (saved-meals section of /profile/saved-meals) and anonymous
        // viewers to a sign-up prompt that uses the same vocabulary.
        toProfile: 'Open the cookbook',
        signUpPrompt: 'Sign in to keep meals in your cookbook',
        rank: (n: number) => `#${n}`,
        votesYes: (n: number) => `${n} 👍`,
        votesNo: (n: number) => `${n} 👎`,
    },
    myFood: {
        title: 'My Food',
        subtitle: 'Past sessions and favourites.',
        manageHint: 'Swipe left to delete, long-press and drag to reorder.',
        empty: "Your cookbook's empty for now. Heart any meal during a session to keep it here.",
        searchPlaceholder: 'Search meals …',
        cancel: 'Cancel',
    },
    history: {
        title: 'My Sessions',
        empty: 'No tables set yet.',
        voters: (n: number) => (n === 1 ? '1 vote' : `${n} votes`),
        viewResults: 'See standings',
        newSession: 'Plan another',
        tapToExpand: 'Tap to see all sessions',
        tapToCollapse: 'Tap to collapse',
        expiryNote: 'Sessions are deleted automatically after 30 days.',
        relativeJustNow: 'just now',
        relativeMinutes: (n: number) => `${n} min ago`,
        relativeHours: (n: number) => `${n} h ago`,
        relativeDays: (n: number) => `${n} d ago`,
    },
    detail: {
        ingredients: 'Ingredients',
        instructions: 'Method',
        showRecipe: 'Recipe',
        hideRecipe: 'Hide recipe',
        noInstructions: 'No method steps available.',
        stepCount: (n: number) => (n === 1 ? '1 step' : `${n} steps`),
        moreIngredients: (n: number) => (n === 1 ? '+1 more ingredient' : `+${n} more ingredients`),
        close: 'Close',
    },
    heart: {
        save: 'Save to My Food',
        saved: 'Saved in the cookbook',
        unsaved: 'Out of the cookbook',
        signInPrompt: 'Sign in to save',
        signInTitle: 'Sign in to save',
        signInBody: "We'll send you a magic link. You'll land back here afterwards.",
        sendLink: 'Email me the link',
        sentBody: 'Magic link sent. Check your email.',
    },
    common: {
        cancel: 'Cancel',
        close: 'Close',
        delete: 'Delete',
        loading: 'Loading …',
        error: 'Something went wrong. Try again?',
    },
} as const;

export type Translations = typeof t;

// Made with Bob
