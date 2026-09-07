import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('shell opts three pages into the 100dvh contract', async () => {
    const source = await read('../src/App.jsx');
    assert.match(source, /VIEWPORT_FIT_PAGES = new Set\(\['Leaderboard', 'Tournaments', 'Game'\]\)/);
    assert.match(source, /VIEWPORT_FIT_PAGES\.has\(page\) && !isInMatch/);
    assert.match(source, /viewport-fit-shell/);
    // Footer would eat the fixed height budget.
    assert.match(source, /!isInMatch && !isAdminPage && !isViewportFit/);
});

test('css contract: fixed shell, one internal scroll, bail-out on tiny viewports', async () => {
    const css = await read('../src/styles.css');
    assert.match(css, /\.viewport-fit-shell \{\s*height: 100dvh;\s*overflow: hidden;/);
    assert.match(css, /\.vf-page \{[^}]*grid-template-rows: auto minmax\(0, 1fr\) auto;/);
    assert.match(css, /@media \(max-height: 639px\)/);
    assert.match(css, /@media \(max-height: 479px\)/);
});

test('pager is click navigation with a11y state', async () => {
    const source = await read('../src/components/ui/Pager.jsx');
    assert.match(source, /<nav aria-label=/);
    assert.match(source, /aria-current=\{index === page \? 'page' : undefined\}/);
    assert.match(source, /aria-live="polite"/);
    assert.match(source, /vf-pager-button/);
});

test('lists paginate instead of scrolling the page', async () => {
    const leaderboard = await read('../src/pages/Leaderboard.jsx');
    assert.match(leaderboard, /PAGE_SIZE = 10/);
    assert.match(leaderboard, /rows\.slice\(/);
    assert.match(leaderboard, /vf-page/);
    assert.match(leaderboard, /vf-body/);

    const rooms = await read('../src/pages/Game/components/PublicRoomList.jsx');
    assert.match(rooms, /ROOMS_PER_PAGE = 8/);
    assert.match(rooms, /visibleRooms\.map\(/);

    const lobby = await read('../src/pages/Game/components/LobbyHomeView.jsx');
    assert.match(lobby, /vf-page/);
    assert.match(lobby, /vf-body/);
});

test('arena keeps Active Games reachable via exactly one scroll pane', async () => {
    const lobby = await read('../src/pages/Game/components/LobbyHomeView.jsx');
    // Mode cards move into a side rail so the room list owns the leftover height.
    assert.match(lobby, /vf-body vf-arena-body/);

    const modes = await read('../src/pages/Game/components/LobbyModeCards.jsx');
    assert.match(modes, /vf-mode-rail/);
    assert.equal((modes.match(/compact/g) || []).length, 3, 'all three cards are compact');
    // Illustrations are fully contained without cropping transforms.
    assert.match(modes, /imageClass="[^"]*object-contain[^"]*"/);
    assert.doesNotMatch(modes, /object-cover/);
    assert.doesNotMatch(modes, /scale-125/);

    const game = await read('../src/pages/Game.jsx');
    // Compact mode keeps card elements from shrinking into overlap.
    assert.match(game, /shrink-0 mb-1\.5/);

    const rooms = await read('../src/pages/Game/components/PublicRoomList.jsx');
    assert.match(rooms, /ACTIVE GAMES/);
    assert.match(rooms, /flex h-full min-h-0 flex-col/);
    const scrollPanes = rooms.match(/overflow-y-auto/g) || [];
    assert.equal(scrollPanes.length, 1, 'exactly one scroll owner');
    assert.match(rooms, /flex min-h-0 flex-1 flex-col overflow-x-auto overflow-y-auto/);
    // Column labels survive the internal scroll.
    assert.match(rooms, /<thead className="vf-sticky-head">/);

    const css = await read('../src/styles.css');
    // Rail beside the table on desktop, stacked below it otherwise.
    assert.match(css, /@media \(min-width: 1024px\)[^@]*grid-template-columns: minmax\(0, 320px\) minmax\(0, 1fr\);/s);
    assert.match(css, /\.vf-mode-rail \{\s*display: grid;\s*gap: clamp\(/);
    assert.match(css, /\.vf-mode-card__art \{\s*height: clamp\(/);
    assert.match(css, /\.vf-mode-card__art img \{[^}]*object-fit: contain;/);
    assert.match(css, /\.vf-mode-card__art img \{[^}]*aspect-ratio: 2\.1 \/ 1;/);
    // Mobile stacks and scrolls the page instead of clipping it.
    assert.match(css, /@media \(max-width: 767px\)[^@]*\.vf-body \{[^}]*grid-template-rows: none;/s);
});

test('tournament detail swaps stacked sections for a tablist and uses sticky semantic table', async () => {
    const source = await read('../src/pages/Tournaments.jsx');
    assert.match(source, /TOURNAMENTS_PER_PAGE = 4/);
    assert.match(source, /role="tablist"/);
    assert.match(source, /role="tab"/);
    assert.match(source, /role="tabpanel"/);
    assert.match(source, /aria-selected=/);
    assert.match(source, /ArrowRight/);
    assert.match(source, /tabIndex=\{tab === entry\.id \? 0 : -1\}/);

    // Standings uses semantic table with sticky header and column scopes
    assert.match(source, /<thead className="vf-sticky-head">/);
    assert.match(source, /<th scope="col"/);
    // Tabpanel is the single scroll owner for detail pane
    assert.match(source, /role="tabpanel"[^>]*vf-body min-h-0 flex-1 overflow-y-auto/);
});

test('leaderboard adheres to viewport-fit with sticky table, accessible headers, and docked user rank', async () => {
    const source = await read('../src/pages/Leaderboard.jsx');
    // Semantic table structure with sticky header and scope="col"
    assert.match(source, /<table className="w-full/);
    assert.match(source, /<thead className="vf-sticky-head">/);
    assert.match(source, /<th scope="col"/);
    // Exactly one scroll owner inside the leaderboard card
    assert.match(source, /min-h-0 flex-1 flex-col overflow-x-auto overflow-y-auto/);
    // Pinned bar when current user is outside current page
    assert.match(source, /Bạn \(Hạng #/);
    // Top 3 visual badges (Gold, Silver, Bronze)
    assert.match(source, /🥇/);
    assert.match(source, /🥈/);
    assert.match(source, /🥉/);
});

test('retro ui pages do not use generic material symbol icons', async () => {
    const leaderboard = await read('../src/pages/Leaderboard.jsx');
    const tournaments = await read('../src/pages/Tournaments.jsx');
    const rooms = await read('../src/pages/Game/components/PublicRoomList.jsx');
    const shop = await read('../src/pages/Shop.jsx');
    const wardrobe = await read('../src/pages/Wardrobe.jsx');
    const wardrobePreview = await read('../src/components/wardrobe/WardrobePreview.jsx');
    const wardrobeInventory = await read('../src/components/wardrobe/WardrobeInventory.jsx');
    const wardrobeItemCard = await read('../src/components/wardrobe/WardrobeItemCard.jsx');
    const friends = await read('../src/pages/Friends.jsx');
    const mission = await read('../src/pages/Mission.jsx');
    const waitingRoom = await read('../src/pages/Game/views/WaitingRoomView.jsx');
    const navbar = await read('../src/components/Navbar.jsx');

    assert.doesNotMatch(leaderboard, /material-symbols/);
    assert.doesNotMatch(tournaments, /material-symbols/);
    assert.doesNotMatch(rooms, /material-symbols/);
    assert.doesNotMatch(shop, /material-symbols/);
    assert.doesNotMatch(wardrobe, /material-symbols/);
    assert.doesNotMatch(wardrobePreview, /material-symbols/);
    assert.doesNotMatch(wardrobeInventory, /material-symbols/);
    assert.doesNotMatch(wardrobeItemCard, /material-symbols/);
    assert.doesNotMatch(friends, /material-symbols/);
    assert.doesNotMatch(mission, /material-symbols/);
    assert.doesNotMatch(waitingRoom, /material-symbols/);
    assert.doesNotMatch(navbar, /material-symbols/);
});

test('mission page renders numbered badges and claimable count status', async () => {
    const mission = await read('../src/pages/Mission.jsx');
    assert.match(mission, /#{index \+ 1}/);
    assert.match(mission, /claimableCount/);
    assert.match(mission, /missions:updated/);
    assert.match(mission, /rounded-2xl/);
});


