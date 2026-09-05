---
name: Room to Wonder
description: A warm, enclosed first-person classroom with mobile walking and an optional dollhouse overview.
colors:
  school-green: "#425a45"
  ink: "#303e36"
  cream: "#eeeae2"
  panel: "#faf7ef"
  navigation: "#fcfaf5"
  sage: "#657c5e"
  focus: "#ad693d"
  immersive-control: "#263a32"
  immersive-panel: "#fbf7ed"
  immersive-label: "#fffbed"
  golden-background: "#eee0ce"
  night-background: "#262e38"
typography:
  display:
    fontFamily: '"Mona Sans Variable", sans-serif'
    fontSize: "26px"
    fontWeight: 450
    lineHeight: 1.1
    letterSpacing: "-0.7px"
  body:
    fontFamily: '"Mona Sans Variable", sans-serif'
    fontSize: "13px"
    lineHeight: 1.9
rounded:
  action: "8px"
  panel: "16px"
components:
  primary-action:
    backgroundColor: "{colors.school-green}"
    rounded: "{rounded.action}"
    padding: "10px 12px"
---

# Design System: Room to Wonder

## Overview

Scope: the classroom experience in this directory only. The existing portfolio retains its own design system.

The default is an immersive first-person classroom: cream enclosing walls and ceiling, wooden floors, green school furniture, and sunlight through modeled windows. The visitor starts at the rear entrance at eye height and can walk the aisles and look in any direction. The room is procedural Three.js geometry, not a static visual comp. An optional Room overview preserves the original architectural dollhouse, hiding the extra enclosure and outdoor scenery. The classroom is the main content and source of depth.

## Colors

School green marks selected controls and primary actions. Ink carries text on light surfaces; sage accents the overview heading. First-person navigation combines cream panels with dark green movement, map, and discovery surfaces and warm light labels. Daylight, Golden hour, and After hours change the modeled light and atmosphere. Maintain readable labels independently of the room behind them.

## Typography

Mona Sans supplies the interface and display heading. Georgia italic supplies the expressive display word; Georgia also supplies discovery titles. The first-person welcome is 26px on desktop and 23px on portrait mobile. The optional overview retains its larger editorial heading, reaching 76px on desktop and 45px on mobile. Keep the short two-line headings and restrained supporting copy. Small labels accompany consistent Phosphor icons; accessible names describe each action.

## Layout

The first-person scene fills the viewport behind controls. A dark header anchors the brand and help. A compact welcome sits upper left, lighting and a live floor plan upper right, movement lower left, and look guidance and rotation controls lower right. View navigation and five discovery shortcuts sit along the bottom. A center dot supports orientation.

At 700px and below, shorten the welcome, keep lighting horizontal, reduce the floor plan, and position movement and look controls above the bottom navigation for two-thumb use. At landscape heights of 600px or less and widths above 700px, hide the welcome, map, and discovery count and compact the header and controls. Bottom navigation and discovery panels account for safe-area insets. Panels scroll when height is constrained. Resizing updates the camera projection without resetting the player's position or heading.

Room overview retains its editorial composition: introduction left and model centrally/right on desktop, introduction above the room and vertical lighting on portrait mobile. Its drag/pinch hint and zoom controls appear only in overview.

## Elevation & Depth

Modeled architecture, furniture, and cast sun shadows provide the main depth. Navigation uses a soft offset shadow (`0 8px 30px #4e40251a`); discovery panels use `0 15px 50px #39472c20`. Walking responds continuously to input; location shortcuts reposition immediately. Overview orbiting uses damping. Reduced motion removes interface transitions and ambient dust rotation; globe interaction becomes a discrete turn.

## Shapes

Furniture has lightly rounded physical edges. Interface tool groups and view navigation use compact pill silhouettes; discovery panels use the panel radius and actions use the action radius. Use thin, muted outlines on tool groups and a circular brand symbol.

## Components

- **Walking:** drag the left joystick to move relative to the current heading; drag the classroom with another finger to look simultaneously. Desktop uses WASD to walk, arrow keys to look, and mouse dragging to look. Four named step buttons support Tab and Enter. Walls and furniture stop movement; movement slides along obstacle edges. Input clears on blur or page visibility changes.
- **Overview:** drag rotates; pinch or mouse wheel zooms. Named zoom and rotation buttons provide alternatives. Walking controls disappear in this mode.
- **View navigation:** Walk inside returns to the entrance; Room overview selects the dollhouse; Front row moves near the board at standing eye height. Return to entrance resets the walking position. Selected views expose pressed state. The reading-corner action opens a walking preset by the bookshelf.
- **Lighting:** Daylight, Golden hour, and After hours update both room lighting and interface atmosphere. Selected controls remain visibly distinct.
- **Discoveries:** globe, board, books, plant, and bell are available through unobstructed scene picking and named shortcuts. The count tracks unique discoveries. Panels offer globe turn/spin, next lesson, a reading-corner visit, a golden-hour toggle, or an audible bell.
- **Panels:** help and discovery panels pause walking and scene picking while open; movement controls disappear. Focus enters on opening; Close and Escape return focus. These are contextual panels rather than blocking dialogs.
- **States:** scene-dependent camera and lighting controls wait for the first rendered frame. Loading is announced; WebGL failure offers recovery. Bell audio starts only after activation and reports success or failure.
- **Feedback:** focus rings use the focus color with a 3px outline and 4px offset. Primary actions darken on hover. Reduced-motion globe copy says “Turn the globe.”

## Do's and Don'ts

- Do keep first-person walking as the default and preserve practical simultaneous movement/look access on mobile.
- Do preserve room visibility, collision boundaries, and camera pose during responsive layout changes.
- Do extend the modeled classroom and its material palette when adding objects.
- Do keep equivalent named controls for interactions available through scene picking.
- Don't apply this classroom identity to the portfolio or replace the interactive room with a static image.
