# Project completion contract

For implementation changes, publish the validated result to the configured live environment unless the user explicitly requests a local-only or draft outcome.

Completion requires verification of the deployed URL in a connected external browser. Local automation, simulated viewports, headless tests, and the in-app browser are supporting checks; they do not replace an external-browser pass against the live deployment.

Run the repository gates before publishing. After deployment, confirm the live revision, exercise the changed interactions at relevant phone and desktop sizes in the external browser, and report completion only when those checks pass. If publishing or external-browser access is unavailable, report the concrete blocker instead of treating the local build as complete.
