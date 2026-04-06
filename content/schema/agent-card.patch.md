# agent-card.json Patch Notes

This file records recommended fixes before directly editing content/schema/agent-card.json.

## High-priority fixes

1. Replace human-facing page URLs with canonical A2A endpoints where appropriate
2. Confirm each agent has the correct dedicated endpoint
3. Align with A2A-discoverable fields where possible

## Recommended examples

### Current problematic pattern
- endpoint: https://www.hsworking.com/ai-solutions

### Preferred canonical pattern
- endpoint: https://www.hsworking.com/_functions/a2a_booking_link

## Additional A2A-friendly fields to consider

- defaultInputModes
- defaultOutputModes
- skills[]
- supportedMediaTypes
- supportsAuthenticatedExtendedCard

## Note

Do not overwrite the live agent card blindly. Validate against the current production schema first.
