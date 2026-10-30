# AI Command Centre — Local Model Experiment

A lightweight, browser-based project and task dashboard created as a practical experiment in AI-assisted development and personal workflow management.

**Live demo:** https://jazblue.github.io/mywebsite/ai-command-centre/

## What it does

- **Project tracking:** create, edit, select and remove projects, with descriptions and colour labels.
- **Task checklist:** attach tasks to projects, set optional due dates, edit tasks, mark them complete, and remove them.
- **Progress overview:** view completion progress across the task list and progress for individual projects.
- **Notes workspace:** keep a free-form note area for ideas, links and reminders.
- **Local persistence:** save projects, tasks and notes in the browser using `localStorage`, so data remains available in that browser on that device.
- **JSON backup and restore:** export the current workspace to a JSON file and import a previously exported JSON file.
- **Responsive interface:** a simple dashboard layout intended for day-to-day personal use.

## Technology

The published app is built with standard front-end technologies:

- HTML for the interface
- CSS for layout and styling
- Vanilla JavaScript for application behaviour
- Browser `localStorage` for persistence
- JSON for portable data export and import
- GitHub Pages for hosting the demo

There is no server-side database or account synchronisation in the current implementation. Because the data is stored in browser-local storage, use **Export** regularly if you want a portable backup, and import the JSON file when moving the workspace to another browser or device.

## Local AI experiment

This project sits alongside experiments with running language models locally, including exploration of Ollama and Qwen models, and using AI coding assistants such as Claude Code to help design, implement and refine software.

The current dashboard is a local-first project/task tracker; its published JavaScript does not itself call an Ollama endpoint or require a model to run. The local-model work is part of the development and learning context, rather than a live AI feature inside this app.

## Relationship to Hermes automation

Hermes Agent is also used for scheduled automation and recurring jobs. A separate monitoring/reporting workflow has been used to review scheduled-job outcomes on a regular 30-minute cycle and highlight successful runs or failures for investigation. This README records that wider learning context; the browser dashboard described above does **not** currently read Hermes job status or control Hermes jobs.

## How to use

1. Open the [live demo](https://jazblue.github.io/mywebsite/ai-command-centre/).
2. Add a project and give it a short description.
3. Add tasks, optionally assign due dates, and mark tasks complete as work progresses.
4. Use Notes to capture reminders and ideas.
5. Select **Export** to save a JSON backup. Use **Import** to restore a previous backup.

## Current scope and future ideas

The current app is deliberately lightweight and client-side. Possible future improvements include clearer backup guidance, task filtering and sorting, and—if there is a real need—an explicitly designed integration with Hermes status data. Any Hermes integration would need a defined data source and safe boundaries; it is not implemented today.

## What this experiment demonstrates

- Turning a practical personal need into a small working web application
- Building interactive front-end features without a framework
- Managing browser-side state and portable JSON data
- Thinking about local-first tools, privacy, and data portability
- Iterative development with AI-assisted coding and hands-on testing
- Separating implemented functionality from ideas for future integration

---

Part of Jason Harvey's personal projects portfolio: https://jazblue.github.io/mywebsite/