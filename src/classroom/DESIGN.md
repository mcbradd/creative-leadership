---
name: Room to Wonder
description: A warm architectural classroom dollhouse with direct mobile exploration.
colors:
  school-green: "#425a45"
  ink: "#303e36"
  cream: "#eeeae2"
  panel: "#faf7ef"
  navigation: "#fcfaf5"
  sage: "#657c5e"
  focus: "#ad693d"
  golden-background: "#eee0ce"
  night-background: "#262e38"
typography:
  display:
    fontFamily: '"Mona Sans Variable", sans-serif'
    fontSize: "clamp(48px, 4.7vw, 76px)"
    fontWeight: 450
    lineHeight: 1.02
    letterSpacing: "-0.04em"
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

The visual world is a warm architectural dollhouse: cream cutaway walls, wooden floors, green school furniture, and sunlight through modeled windows. A quiet editorial interface frames actual Three.js geometry. The classroom is the main content and the source of visual depth.

## Colors

School green marks selected controls and primary actions. Ink carries interface text; sage accents the italic display word. Cream provides the daylight canvas, with panel and navigation surfaces slightly lighter. Golden hour warms the canvas; after hours darkens it and raises secondary text contrast. Maintain readable labels in all three atmospheres.

## Typography

Mona Sans supplies the interface and display heading. Georgia italic supplies the expressive display word; Georgia also supplies discovery titles. The mobile display is 45px. Keep the short, two-line heading and restrained supporting copy. Small control labels accompany consistent Phosphor icons; accessible names describe each action.

## Layout

Use a viewport experience with an absolutely positioned scene and sparse overlaid controls. Desktop places the introduction left, room centrally/right, lighting upper right, camera tools at the right edge, and view navigation along the bottom.

At 700px and below, stack the introduction above the room, place lighting vertically, and move camera tools above the bottom view navigation. Preserve the visible drag/pinch hint and object shortcuts. Bottom navigation and discovery panels account for safe-area insets. Panels scroll when height is constrained.

## Elevation & Depth

Modeled architecture, furniture, and cast sun shadows provide the main depth. Navigation uses a soft offset shadow (`0 8px 30px #4e40251a`); discovery panels use `0 15px 50px #39472c20`. Camera movement eases exponentially toward presets. Reduced motion removes transitions and ambient movement; globe interaction becomes a discrete turn.

## Shapes

Furniture has lightly rounded physical edges. Interface tool groups and view navigation use compact pill silhouettes; discovery panels use the panel radius and actions use the action radius. Use thin, muted outlines on tool groups and a circular brand symbol.

## Components

- **Scene:** one-finger drag rotates; two-finger pinch zooms. Desktop supports drag and wheel. Zoom and rotation buttons provide keyboard alternatives. Keep the gesture hint visible on portrait mobile.
- **View navigation:** Whole room, Take a seat, and The board move to authored camera presets. Reset returns to Whole room. Selected views expose pressed state.
- **Lighting:** Daylight, Golden hour, and After hours update both room lighting and interface atmosphere. Selected controls remain visibly distinct.
- **Discoveries:** globe, board, books, plant, and bell are available through scene picking and named shortcuts. The count tracks unique discoveries. Panels offer the relevant action: globe turn/spin, next lesson, seat view, golden-hour toggle, or audible bell.
- **Panels:** focus enters on opening; Close and Escape return focus. These are contextual panels rather than blocking dialogs.
- **States:** scene-dependent camera and lighting controls wait for the first rendered frame. Loading is announced; WebGL failure offers recovery. Bell audio starts only after activation and reports success or failure.
- **Feedback:** focus rings use the focus color with a 3px outline and 4px offset. Primary actions darken on hover. Reduced-motion globe copy says “Turn the globe.”

## Do's and Don'ts

- Do preserve room visibility and practical touch access when adjusting the mobile composition.
- Do extend the modeled classroom and its material palette when adding objects.
- Do keep equivalent named controls for interactions available through scene picking.
- Don't apply this classroom identity to the portfolio or replace the interactive room with a static image.
