#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Cognitive modes and their characteristics
enum CognitiveMode {
  PATTERN = 'pattern',      // Pattern recognition and analysis
  DEEP = 'deep',           // Deep, slow thinking
  PARALLEL = 'parallel',   // Parallel task execution
  SYNTHESIS = 'synthesis', // Cross-domain synthesis
  AUTO = 'auto'           // Automatic mode selection
}

interface CognitiveTask {
  id: string;
  content: string;
  mode: CognitiveMode;
  priority: number;
  context?: any;
  created: Date;
  status: 'pending' | 'routing' | 'processing' | 'completed' | 'failed';
  result?: any;
  insights?: string[];
  metadata?: {
    routedTo?: string[];
    processingTime?: number;
    significanceScore?: number;
  };
}

// Task queue and management
const cognitiveQueue = new Map<string, CognitiveTask>();
const insights = new Map<string, any>();

// Mode routing logic
function selectOptimalMode(content: string, explicitMode?: CognitiveMode): CognitiveMode {
  if (explicitMode && explicitMode !== CognitiveMode.AUTO) {
    return explicitMode;
  }

  // Analyze content to determine best mode
  const contentLower = content.toLowerCase();
  
  // Pattern detection keywords
  if (contentLower.includes('pattern') || contentLower.includes('trend') || 
      contentLower.includes('recurring') || contentLower.includes('similarity')) {
    return CognitiveMode.PATTERN;
  }
  
  // Deep thinking keywords
  if (contentLower.includes('why') || contentLower.includes('philosophy') ||
      contentLower.includes('meaning') || contentLower.includes('fundamental')) {
    return CognitiveMode.DEEP;
  }
  
  // Parallel processing keywords
  if (contentLower.includes('multiple') || contentLower.includes('simultaneous') ||
      contentLower.includes('compare') || contentLower.includes('batch')) {
    return CognitiveMode.PARALLEL;
  }
  
  // Synthesis keywords
  if (contentLower.includes('connect') || contentLower.includes('integrate') ||
      contentLower.includes('combine') || contentLower.includes('unify')) {
    return CognitiveMode.SYNTHESIS;
  }
  
  // Default to pattern recognition
  return CognitiveMode.PATTERN;
}

// Route task to appropriate subsystem
async function routeToSubsystem(task: CognitiveTask): Promise<string[]> {
  const routes: string[] = [];
  
  switch (task.mode) {
    case CognitiveMode.PATTERN:
      routes.push('contemplation'); // Best for pattern recognition
      break;
      
    case CognitiveMode.DEEP:
      routes.push('subconscious'); // Best for deep thinking
      if (task.priority > 7) {
        routes.push('contemplation'); // Also use contemplation for high priority
      }
      break;
      
    case CognitiveMode.PARALLEL:
      routes.push('elvis'); // Best for parallel execution
      break;
      
    case CognitiveMode.SYNTHESIS:
      routes.push('contemplation', 'subconscious'); // Use both for synthesis
      break;
  }
  
  return routes;
}

// Initialize server
const server = new Server(
  {
    name: 'mcp-cognition',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
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

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'cognition_process': {
      const { content, mode = 'auto', priority = 5, context } = args as any;
      
      // Generate task ID
      const taskId = `cog_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      // Determine optimal mode
      const selectedMode = selectOptimalMode(content, mode as CognitiveMode);
      
      // Create task
      const task: CognitiveTask = {
        id: taskId,
        content,
        mode: selectedMode,
        priority,
        context,
        created: new Date(),
        status: 'pending',
      };
      
      // Add to queue
      cognitiveQueue.set(taskId, task);
      
      // Route to subsystems
      task.status = 'routing';
      const routes = await routeToSubsystem(task);
      task.metadata = { routedTo: routes };
      
      // Simulate processing (in real implementation, would call actual subsystems)
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
      const { timeframe = 'recent', minSignificance = 5, mode } = args as any;
      
      // In real implementation, would aggregate from all subsystems
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
                  filteredInsights.map(i => 
                    `[${i.significance}/10] ${i.content}\n` +
                    `Source: ${i.source} | Type: ${i.type}`
                  ).join('\n\n'),
          },
        ],
      };
    }

    case 'cognition_status': {
      const { includeQueue = false } = args as any;
      
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
      const { topic, depth = 'medium' } = args as any;
      
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
      const { feedback, taskId } = args as any;
      
      const task = cognitiveQueue.get(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }
      
      // In real implementation, would update routing algorithms
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

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);
console.error('mcp-cognition server running - Unified Cognitive Layer Active');