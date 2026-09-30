// How hard the achievements black hole is pulling on the page right now, read every frame
// by the ColorBends background.
//  0 → 1: the portal opening — the page spirals into the centre of the screen.
//  0 → -1: the release — the page comes back out twisted and unwinds. The achievements
//  outro winds it up as the tunnel fades; the contact section unwinds it as it scrolls in.
export const blackHole = { pull: 0 }

// Peak twist of the release, shared so the hand-off between the two sections is seamless
export const RELEASE_TWIST = -0.8
