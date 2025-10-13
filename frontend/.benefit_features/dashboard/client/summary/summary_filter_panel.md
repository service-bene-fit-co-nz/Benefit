[SYSTEM MESSAGE/ROLE]
You are an expert Senior React UI developer. Your task is to design, plan, and generate all necessary code for a new feature.

[FEATURE GOAL]
We need to create a side bar panel at src/components/dashboard/trainer/summary/SummaryFilterPanel.tsx
This panel will have a number of sections
Search section: Needs to be able to search for clients by Email and/or Name and/or programe
Perhaps we can use a single text box for input but allow some psuedo sql

e.g. (name: brent or email: brent) and programme: Benefit

Clients Section: This is a collapsable list of Clients based on the search results. Should show full name and maybe email address in brakets
Inthis section only show 4 clients max and allow scrolling if more clients in search results.

The following will be filters by current selected client but all will have and Add New entry
Each is collapsible and have an icon
Habits Section
Fitness Tracker Section
Email Section
Notes Section
Forms Section

Each section should be a separate component created in /Users/brentedwards/Projects/Benefit-Pro/frontend/src/components/dashboard/trainer/summary

[FUNCTIONAL REQUIREMENTS]

- Endpoint: POST /api/v1/posts/{post_id}/like
- Input: Requires an authenticated user token.
- Logic: If the user has already liked the post, the action should be an 'unlike' (remove the like). Otherwise, it should add a 'like'.
- Response: Return a 200 OK with the new like count for the post.

[TECHNICAL CONTEXT]

- Framework: Django Rest Framework (DRF).
- Existing Model: We have a `Post` model. You need to create a new `PostLike` model.
- Authentication: Use the existing `IsAuthenticated` DRF permission class.
- Style: Use snake_case for all Python variables and class-based views.

[NON-FUNCTIONAL REQUIREMENTS]

- Performance: The database operation must be atomic to prevent race conditions.
- Tests: Include a unit test for both the 'like' and 'unlike' logic using the Django Test Client.
