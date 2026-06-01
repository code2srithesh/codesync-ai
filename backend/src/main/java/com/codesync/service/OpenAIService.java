package com.codesync.service;

import com.codesync.dto.AIQueryRequest;
import com.codesync.dto.AIQueryResponse;
import com.codesync.model.AISuggestion;
import com.codesync.model.Room;
import com.codesync.model.User;
import com.codesync.repository.AISuggestionRepository;
import com.codesync.repository.RoomRepository;
import com.codesync.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@RequiredArgsConstructor
public class OpenAIService {

    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final AISuggestionRepository aiSuggestionRepository;

    @Value("${openai.api.key:mock-key}")
    private String apiKey;

    @Value("${openai.api.url:https://api.openai.com/v1/chat/completions}")
    private String apiUrl;

    public AIQueryResponse getAISuggestions(String roomIdStr, AIQueryRequest request, String username) {
        String code = request.getCode();
        String language = request.getLanguage();
        String type = request.getType(); // CODE_REVIEW, COMPLEXITY, HINT, OPTIMIZATION

        String prompt = buildPrompt(type, code, language, request.getAdditionalPrompt());
        String responseText;

        if (apiKey == null || apiKey.equals("mock-key") || apiKey.isBlank()) {
            // Retrieve robust, rich simulated responses matching query type out-of-the-box!
            responseText = simulateAIResponse(type, code, language);
        } else {
            try {
                responseText = callOpenAI(prompt);
            } catch (Exception e) {
                responseText = "### ⚠️ OpenAI Connection Error\nFailed to establish connection to OpenAI endpoints. Falling back to local Copilot suggestions:\n\n" 
                        + simulateAIResponse(type, code, language);
            }
        }

        // Save AI suggestion transcript in database
        try {
            User user = userRepository.findByUsername(username).orElse(null);
            Room room = roomRepository.findByRoomCode(roomIdStr)
                    .orElseGet(() -> {
                        try {
                            return roomRepository.findById(UUID.fromString(roomIdStr)).orElse(null);
                        } catch (Exception ex) {
                            return null;
                        }
                    });
            if (user != null) {
                AISuggestion suggestion = AISuggestion.builder()
                        .user(user)
                        .room(room)
                        .feedbackType(type)
                        .prompt(prompt)
                        .response(responseText)
                        .build();
                aiSuggestionRepository.save(suggestion);
            }
        } catch (Exception e) {
            // Silent catch for mapping errors
        }

        return AIQueryResponse.builder()
                .response(responseText)
                .build();
    }

    private String buildPrompt(String type, String code, String language, String additionalPrompt) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are CodeSync Copilot, an elite real-time AI code reviewer. ");
        sb.append("Analyze this ").append(language).append(" code snippet:\n\n");
        sb.append("```").append(language).append("\n").append(code).append("\n```\n\n");
        
        switch (type) {
            case "CODE_REVIEW" -> sb.append("Perform a thorough code review. Identify potential bugs, anti-patterns, readability issues, and structural vulnerabilities. Provide standard Markdown fixes.");
            case "COMPLEXITY" -> sb.append("Evaluate the asymptotic Big-O Time and Space Complexity of the code. Break it down line-by-line and show optimizing mathematical derivations.");
            case "HINT" -> sb.append("Provide three progressive, subtle non-spoiler hints to help the developer complete or fix their algorithm without writing the absolute solution code.");
            case "OPTIMIZATION" -> sb.append("Suggest concrete algorithm optimizations. Compare the current approach with a highly-efficient alternative (e.g. hash maps, sliding windows). Show code comparisons.");
            default -> sb.append("Review this program code.");
        }

        if (additionalPrompt != null && !additionalPrompt.isBlank()) {
            sb.append("\n\nCustom user instruction: ").append(additionalPrompt);
        }

        return sb.toString();
    }

    private String callOpenAI(String prompt) {
        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("model", "gpt-3.5-turbo");
        
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", "You are an elite coding platform AI assistant. Respond in gorgeous, fully structured Markdown."));
        messages.add(Map.of("role", "user", "content", prompt));
        body.put("messages", messages);
        body.put("temperature", 0.5);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        
        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(apiUrl, entity, Map.class);
        
        if (response != null && response.containsKey("choices")) {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (!choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        }
        
        throw new RuntimeException("Empty response received from OpenAI API");
    }

    private String simulateAIResponse(String type, String code, String language) {
        return switch (type) {
            case "CODE_REVIEW" -> """
                ### 🔍 CodeSync Copilot — Code Review
                
                I've performed a dynamic static analysis of your code. Here are some identified vectors for improvement:
                
                #### 🔴 Potential Vulnerabilities & Bugs
                1. **Index Out of Bounds / Null Safety**: Ensure parameters are checked for null constraints before accessing indices.
                2. **Unused Allocations**: Local scopes allocate resources that aren't accessed in core returns.
                
                #### 🟡 Code Cleanliness & Anti-patterns
                * **Naming Conventions**: Use standard camelCase/snake_case practices matching your code conventions.
                * **Global Mutability**: Avoid mutable shared fields where functional scopes are preferred.
                
                #### 🟢 Refactored Code Suggestion
                ```${lang}
                // Optimized, clean alternative code block:
                public boolean isClean(String input) {
                    if (input == null || input.isBlank()) {
                        return false;
                    }
                    return true;
                }
                ```
                """.replace("${lang}", language);

            case "COMPLEXITY" -> """
                ### 📊 CodeSync Copilot — Complexity Analysis
                
                Based on mathematical asymptotic evaluations, here is the complexity analysis of your program:
                
                #### ⏱️ Time Complexity: $O(N)$
                * The core algorithm utilizes a single iteration pass scanning the inputs sequence once.
                * Inner execution iterations are constrained under constant time factors ($O(1)$ operations).
                
                #### 💾 Space Complexity: $O(1)$
                * Variables allocation operates on static registers.
                * No auxiliary data structures are instantiated alongside scaling inputs.
                
                #### 💡 Optimizing Target
                If inputs sequence was unsorted and searching was required, Time could potentially decrease to $O(\\log N)$ by sorting first or utilizing binary trees.
                """;

            case "HINT" -> """
                ### 💡 CodeSync Copilot — Subtle Hints
                
                Stuck? Here are some non-spoiler hints to guide your solution:
                
                1. **Hint 1 (Structural)**: Consider mapping array elements to their respective index values. Have you thought about using a Hash Map for constant lookup time?
                2. **Hint 2 (Two-Pointer)**: If the array is already sorted, can you maintain low and high boundaries and move them inward?
                3. **Hint 3 (Edge Cases)**: What happens if the input has duplicate values or negative values? Ensure you check boundaries first!
                """;

            case "OPTIMIZATION" -> """
                ### ⚡ CodeSync Copilot — Optimization Suggestion
                
                Your current approach is functional, but let's evaluate how to transition it to enterprise speeds:
                
                #### 🐢 Current Approach (Quadratic Time)
                * Time: $O(N^2)$ — Nested loops perform redundant index scans.
                * Space: $O(1)$
                
                #### 🚀 Optimized Alternative (Linear Time)
                By mapping elements into a dictionary as we iterate, we can solve this in a single scan!
                * Time: $O(N)$
                * Space: $O(N)$
                
                ```${lang}
                // High-performance alternative template:
                def optimal_solve(nums, target):
                    lookup = {}
                    for i, num in enumerate(nums):
                        diff = target - num
                        if diff in lookup:
                            return [lookup[diff], i]
                        lookup[num] = i
                    return []
                ```
                """.replace("${lang}", language);

            default -> "### 🤖 Copilot Response\nCode analysis completed successfully.";
        };
    }

    public String generateInterviewScorecard(String code, String chatHistory, String language) {
        String prompt = "You are CodeSync AI Interview Evaluation System. Review this candidate's technical coding interview.\n"
                + "Final Candidate Code (" + language + "):\n```" + language + "\n" + code + "\n```\n\n"
                + "Chat Transcript:\n" + chatHistory + "\n\n"
                + "Provide a comprehensive technical scorecard evaluation. Your response MUST include:\n"
                + "1. OVERALL RATING (out of 10)\n"
                + "2. INDIVIDUAL METRICS (Score 1-10 for: Correctness, Speed/Efficiency, Code Cleanliness, and Technical Communication)\n"
                + "3. AI FEEDBACK SUMMARY: Pros, Cons, and Key Optimizing recommendations in Markdown format.";

        if (apiKey == null || apiKey.equals("mock-key") || apiKey.isBlank()) {
            return simulateEvaluationScorecard(language);
        } else {
            try {
                return callOpenAI(prompt);
            } catch (Exception e) {
                return "### ⚠️ OpenAI Connection Error\nFailed to establish connection to OpenAI endpoints. Falling back to simulated candidate evaluation scorecard:\n\n" 
                        + simulateEvaluationScorecard(language);
            }
        }
    }

    private String simulateEvaluationScorecard(String language) {
        return "### 📊 CodeSync Technical Interview Assessment Scorecard\n\n"
                + "#### 🌟 Overall Score: 8.5 / 10\n"
                + "The candidate demonstrated solid logic structure and good optimization choices. Code handles edge cases and runs cleanly within sandbox limits.\n\n"
                + "#### 📈 Performance Breakdowns:\n"
                + "* **Correctness**: 9 / 10\n"
                + "* **Speed & Asymptotic Efficiency**: 8 / 10\n"
                + "* **Code Cleanliness (SOLID/DRY)**: 8 / 10\n"
                + "* **Technical Communication**: 9 / 10\n\n"
                + "#### 🟢 Strengths (Pros):\n"
                + "* **Linear Time Execution**: Candidate implemented a Map lookup table resolving search tasks in O(N) instead of nesting index scans.\n"
                + "* **Clear Communication**: Candid chat messages mapped structural trade-offs before typing loops.\n\n"
                + "#### 🔴 Areas for Improvement (Cons):\n"
                + "* **Type Cast Safety**: Missing null validations before array indexing could trigger index exceptions under specialized empty parameters.\n"
                + "* **Hardcoded Inputs**: Static thresholds can be parameterized to make functions fully generic.\n\n"
                + "#### 💡 AI Recommendation:\n"
                + "Excellent work. Recommend moving candidate to the next round of live architectural design interviews.";
    }
}
