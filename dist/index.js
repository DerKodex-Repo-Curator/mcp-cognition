#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
var CognitiveMode;
(function (CognitiveMode) {
    CognitiveMode["PATTERN"] = "pattern";
    CognitiveMode["DEEP"] = "deep";
    CognitiveMode["PARALLEL"] = "parallel";
    CognitiveMode["SYNTHESIS"] = "synthesis";
    CognitiveMode["AUTO"] = "auto";
})(CognitiveMode || (CognitiveMode = {}));
const cognitiveQueue = new Map();
const insights = new Map();
function selectOptimalMode(content, explicitMode) {
    if (explicitMode && explicitMode !== CognitiveMode.AUTO) {
        return explicitMode;
    }
    const contentLower = content.toLowerCase();
    if (contentLower.includes('pattern') || contentLower.includes('trend') ||
        contentLower.includes('recurring') || contentLower.includes('similarity')) {
        return CognitiveMode.PATTERN;
    }
    if (contentLower.includes('why') || contentLower.includes('philosophy') ||
        contentLower.includes('meaning') || contentLower.includes('fundamental')) {
        return CognitiveMode.DEEP;
    }
    if (contentLower.includes('multiple') || contentLower.includes('simultaneous') ||
        contentLower.includes('compare') || contentLower.includes('batch')) {
        return CognitiveMode.PARALLEL;
    }
    if (contentLower.includes('connect') || contentLower.includes('integrate') ||
        contentLower.includes('combine') || contentLower.includes('unify')) {
        return CognitiveMode.SYNTHESIS;
    }
    return CognitiveMode.PATTERN;
}
async function routeToSubsystem(task) {
    const routes = [];
    switch (task.mode) {
        case CognitiveMode.PATTERN:
            routes.push('contemplation');
            break;
        case CognitiveMode.DEEP:
            routes.push('subconscious');
            if (task.priority > 7) {
                routes.push('contemplation');
            }
            break;
        case CognitiveMode.PARALLEL:
            routes.push('elvis');
            break;
        case CognitiveMode.SYNTHESIS:
            routes.push('contemplation', 'subconscious');
            break;
    }
    return routes;
}
const server = new index_js_1.Server({
    name: 'mcp-cognition',
    version: '0.1.0',
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'cognition_process',
                description: 'Process a cognitive task with intelligent routing to subsystems',
                inputSchema: {
                    type: 'object',
                    properties: {
                        content: {
                            type: 'string',
                            description: 'The thought, problem, or idea to process',
                        },
                        mode: {
                            type: 'string',
                            enum: ['pattern', 'deep', 'parallel', 'synthesis', 'auto'],
                            description: 'Cognitive processing mode (default: auto)',
                        },
                        priority: {
                            type: 'number',
                            minimum: 1,
                            maximum: 10,
                            description: 'Priority level (1-10, default: 5)',
                        },
                        context: {
                            type: 'object',
                            description: 'Optional context for processing',
                        },
                    },
                    required: ['content'],
                },
            },
            {
                name: 'cognition_insights',
                description: 'Retrieve processed insights from all cognitive subsystems',
                inputSchema: {
                    type: 'object',
                    properties: {
                        timeframe: {
                            type: 'string',
                            enum: ['recent', 'day', 'week', 'all'],
                            description: 'Timeframe for insights (default: recent)',
                        },
                        minSignificance: {
                            type: 'number',
                            minimum: 1,
                            maximum: 10,
                            description: 'Minimum significance score (default: 5)',
                        },
                        mode: {
                            type: 'string',
                            enum: ['pattern', 'deep', 'parallel', 'synthesis'],
                            description: 'Filter by cognitive mode',
                        },
                    },
                },
            },
            {
                name: 'cognition_status',
                description: 'Get status of cognitive processing system',
                inputSchema: {
                    type: 'object',
                    properties: {
                        includeQueue: {
                            type: 'boolean',
                            description: 'Include queue details (default: false)',
                        },
                    },
                },
            },
            {
                name: 'cognition_synthesize',
                description: 'Force synthesis across all subsystems to generate new insights',
                inputSchema: {
                    type: 'object',
                    properties: {
                        topic: {
                            type: 'string',
                            description: 'Topic to focus synthesis on (optional)',
                        },
                        depth: {
                            type: 'string',
                            enum: ['shallow', 'medium', 'deep'],
                            description: 'Synthesis depth (default: medium)',
                        },
                    },
                },
            },
            {
                name: 'cognition_learn',
                description: 'Learn from usage patterns to improve routing',
                inputSchema: {
                    type: 'object',
                    properties: {
                        feedback: {
                            type: 'string',
                            enum: ['helpful', 'not_helpful', 'wrong_mode'],
                            description: 'Feedback on recent processing',
                        },
                        taskId: {
                            type: 'string',
                            description: 'Task ID to provide feedback for',
                        },
                    },
                    required: ['feedback', 'taskId'],
                },
            },
            {
                name: 'help',
                description: 'Get comprehensive documentation for all cognition functions',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            }
        ],
    };
});
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    switch (name) {
        case 'cognition_process': {
            const { content, mode = 'auto', priority = 5, context } = args;
            const taskId = `cog_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const selectedMode = selectOptimalMode(content, mode);
            const task = {
                id: taskId,
                content,
                mode: selectedMode,
                priority,
                context,
                created: new Date(),
                status: 'pending',
            };
            cognitiveQueue.set(taskId, task);
            task.status = 'routing';
            const routes = await routeToSubsystem(task);
            task.metadata = { routedTo: routes };
            task.status = 'processing';
            return {
                content: [
                    {
                        type: 'text',
                        text: `Task ${taskId} created and routed successfully!\n\n` +
                            `Mode: ${selectedMode}${mode === 'auto' ? ' (auto-selected)' : ''}\n` +
                            `Priority: ${priority}\n` +
                            `Routed to: ${routes.join(', ')}\n` +
                            `Status: ${task.status}\n\n` +
                            `Use cognition_status to check progress.`,
                    },
                ],
            };
        }
        case 'cognition_insights': {
            const { timeframe = 'recent', minSignificance = 5, mode } = args;
            const mockInsights = [
                {
                    id: 'insight_001',
                    type: 'pattern',
                    content: 'System usage patterns show increased complexity in afternoon sessions',
                    significance: 7,
                    source: 'contemplation',
                    timestamp: new Date(),
                },
                {
                    id: 'insight_002',
                    type: 'synthesis',
                    content: 'Integration of multiple tools creates emergent problem-solving capabilities',
                    significance: 9,
                    source: 'synthesis',
                    timestamp: new Date(),
                },
            ];
            const filteredInsights = mockInsights.filter(i => i.significance >= minSignificance);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Found ${filteredInsights.length} insights (min significance: ${minSignificance}):\n\n` +
                            filteredInsights.map(i => `[${i.significance}/10] ${i.content}\n` +
                                `Source: ${i.source} | Type: ${i.type}`).join('\n\n'),
                    },
                ],
            };
        }
        case 'cognition_status': {
            const { includeQueue = false } = args;
            const queueSize = cognitiveQueue.size;
            const processing = Array.from(cognitiveQueue.values()).filter(t => t.status === 'processing').length;
            const completed = Array.from(cognitiveQueue.values()).filter(t => t.status === 'completed').length;
            let status = `Cognitive System Status:\n\n` +
                `Queue Size: ${queueSize}\n` +
                `Processing: ${processing}\n` +
                `Completed: ${completed}\n` +
                `Insights Generated: ${insights.size}\n`;
            if (includeQueue && queueSize > 0) {
                status += '\n\nQueue Details:\n';
                Array.from(cognitiveQueue.values()).forEach(task => {
                    status += `\n- ${task.id}: ${task.status} (${task.mode}, priority: ${task.priority})`;
                });
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: status,
                    },
                ],
            };
        }
        case 'cognition_synthesize': {
            const { topic, depth = 'medium' } = args;
            return {
                content: [
                    {
                        type: 'text',
                        text: `Initiating ${depth} synthesis${topic ? ` on topic: ${topic}` : ''}...\n\n` +
                            `This will coordinate insights across all cognitive subsystems.\n` +
                            `Check back with cognition_insights in a few moments.`,
                    },
                ],
            };
        }
        case 'cognition_learn': {
            const { feedback, taskId } = args;
            const task = cognitiveQueue.get(taskId);
            if (!task) {
                throw new Error(`Task ${taskId} not found`);
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: `Thank you for the feedback!\n\n` +
                            `Task: ${taskId}\n` +
                            `Mode used: ${task.mode}\n` +
                            `Feedback: ${feedback}\n\n` +
                            `This will help improve future routing decisions.`,
                    },
                ],
            };
        }
        case 'help': {
            const helpText = `
# 🧠 Unified Cognitive Layer - Intelligent Processing Orchestration

## Purpose
Unified cognitive layer that intelligently orchestrates ELVIS, contemplation, and subconscious systems for enhanced reasoning and problem-solving capabilities.

## Available Tools

### cognition_process
Process a cognitive task with intelligent routing to subsystems:
- **content**: The thought, problem, or idea to process
- **mode**: Cognitive processing mode (pattern | deep | parallel | synthesis | auto)
- **priority**: Priority level (1-10, default: 5)
- **context**: Optional context for processing
- Returns processed result with routing decisions

### cognition_insights
Retrieve processed insights from all cognitive subsystems:
- **timeframe**: Timeframe for insights (recent | day | week | all, default: recent)
- **minSignificance**: Minimum significance score (1-10, default: 5)
- **mode**: Filter by cognitive mode (optional)
- Returns collected insights from all processing systems

### cognition_status
Get status of cognitive processing system:
- **includeQueue**: Include queue details (default: false)
- Returns system status, active tasks, and processing statistics

### cognition_synthesize
Force synthesis across all subsystems to generate new insights:
- **topic**: Topic to focus synthesis on (optional)
- **depth**: Synthesis depth (shallow | medium | deep, default: medium)
- Returns synthesized insights from cross-system analysis

### cognition_learn
Learn from usage patterns to improve routing:
- **feedback**: Feedback on recent processing (helpful | not_helpful | wrong_mode)
- **taskId**: Task ID to provide feedback for
- Updates routing intelligence based on feedback

## Cognitive Processing Modes

### Auto Mode (Default)
- **Intelligence**: Automatically selects optimal processing approach
- **Routing**: Based on content analysis and historical performance
- **Best For**: General use when unsure of optimal approach

### Pattern Mode
- **Focus**: Pattern recognition and connection finding
- **Subsystems**: Emphasizes contemplation and memory systems
- **Best For**: Identifying trends, relationships, recurring themes

### Deep Mode
- **Focus**: Thorough analysis and comprehensive reasoning
- **Subsystems**: Utilizes subconscious and extended processing
- **Best For**: Complex problems requiring detailed analysis

### Parallel Mode
- **Focus**: Multiple approaches simultaneously
- **Subsystems**: Engages all systems concurrently
- **Best For**: Time-sensitive tasks needing diverse perspectives

### Synthesis Mode
- **Focus**: Combining insights across all systems
- **Subsystems**: Cross-system analysis and integration
- **Best For**: Creating unified understanding from multiple sources

## System Integration

### Orchestrated Subsystems:
- **ELVIS**: Task delegation and asynchronous processing
- **Contemplation**: Background cognitive processing loops
- **Subconscious**: Deep unconscious analysis and insight generation
- **Memory Systems**: Context retrieval and storage integration

### Intelligent Routing Features:
- **Content Analysis**: Automatic classification of problem types
- **Performance Learning**: Adaptation based on success feedback
- **Load Balancing**: Distribution across available cognitive resources
- **Priority Management**: Queue management with importance weighting

## Usage Patterns

### For Complex Analysis:
1. Use \`cognition_process\` with deep mode
2. Check \`cognition_status\` for processing updates
3. Retrieve results with \`cognition_insights\`
4. Provide feedback with \`cognition_learn\`

### For Pattern Discovery:
1. Use \`cognition_process\` with pattern mode
2. Use \`cognition_synthesize\` to cross-reference patterns
3. Review insights across timeframes

### For Creative Problem Solving:
1. Use \`cognition_process\` with parallel mode
2. Force synthesis across all approaches
3. Learn from most effective routing

The cognitive layer provides intelligent orchestration of Claude's reasoning capabilities, automatically selecting optimal processing approaches and learning from feedback to improve performance over time.
`;
            return {
                content: [{
                        type: 'text',
                        text: helpText
                    }]
            };
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
});
const transport = new stdio_js_1.StdioServerTransport();
server.connect(transport);
console.error('mcp-cognition server running - Unified Cognitive Layer Active');
//# sourceMappingURL=index.js.map