```javascript
goal=tag
draw10Questions = getQuestions(exam.tag)
  .map(question => ({
    ...question,
    priority:
      (question.weaknessScore * question.relevance * 100) +
      (question.unanswered ? 1000 : 0) +
      (question.wrongPercentage * 10)
  }))
  .sort((a, b) => b.priority - a.priority)
  .slice(0, 10);
```

```yaml
title: "Exam"
type: "object"
properties:
    title:
    code:
    description:
    tags:
        type: "array"
        items:
            type: "string"
    domains:
        type: "array"
        items:
            type: "object"
            properties:
                description:
                    type: "string"
                tags:
                    type: array
                    items:
                        type: "string"
                weighting:
                    type: number
                    min: 0
                    max: 1
```
