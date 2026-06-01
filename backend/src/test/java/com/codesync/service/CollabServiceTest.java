package com.codesync.service;

import com.codesync.dto.RoomRequest;
import com.codesync.dto.RoomResponse;
import com.codesync.model.*;
import com.codesync.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CollabServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private RoomParticipantRepository participantRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private SessionPlaybackRepository playbackRepository;

    @Mock
    private WhiteboardElementRepository whiteboardElementRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private CollabService collabService;

    @Test
    public void testCreateRoom_Success() {
        // Arrange
        String creatorUsername = "creator";
        User creator = User.builder()
                .id(UUID.randomUUID())
                .username(creatorUsername)
                .email("creator@codesync.com")
                .build();

        RoomRequest request = new RoomRequest("Test Room", "Room for testing", false, "");

        when(userRepository.findByUsername(creatorUsername)).thenReturn(Optional.of(creator));
        
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> {
            Room room = invocation.getArgument(0);
            room.setId(UUID.randomUUID());
            room.setCreatedAt(LocalDateTime.now());
            return room;
        });

        when(participantRepository.save(any(RoomParticipant.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            doc.setId(UUID.randomUUID());
            return doc;
        });

        // Act
        RoomResponse response = collabService.createRoom(request, creatorUsername);

        // Assert
        assertNotNull(response);
        assertNotNull(response.getId());
        assertNotNull(response.getRoomCode());
        assertEquals("Test Room", response.getName());
        assertEquals("Room for testing", response.getDescription());
        assertEquals("ACTIVE", response.getStatus());
        assertEquals(creatorUsername, response.getCreatorName());
        assertEquals("python", response.getActiveLanguage());
        assertTrue(response.getActiveContent().contains("Welcome to CodeSync AI"));
        assertEquals(1L, response.getDocumentVersion());

        verify(userRepository, times(1)).findByUsername(creatorUsername);
        verify(roomRepository, times(1)).save(any(Room.class));
        verify(participantRepository, times(1)).save(any(RoomParticipant.class));
        verify(documentRepository, times(1)).save(any(Document.class));
    }

    @Test
    public void testJoinRoom_NewUser() {
        // Arrange
        String roomCode = "abc-defg-hij";
        String username = "collaborator";

        User creator = User.builder()
                .id(UUID.randomUUID())
                .username("creator")
                .build();

        Room room = Room.builder()
                .id(UUID.randomUUID())
                .roomCode(roomCode)
                .name("Sync Room")
                .status("ACTIVE")
                .creator(creator)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        User user = User.builder()
                .id(UUID.randomUUID())
                .username(username)
                .build();

        Document document = Document.builder()
                .id(UUID.randomUUID())
                .room(room)
                .language("python")
                .content("print('collab')")
                .version(2L)
                .build();

        when(roomRepository.findByRoomCode(roomCode)).thenReturn(Optional.of(room));
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(participantRepository.findByRoomIdAndUserId(room.getId(), user.getId())).thenReturn(Optional.empty());
        when(documentRepository.findByRoomId(room.getId())).thenReturn(Optional.of(document));

        // Act
        RoomResponse response = collabService.joinRoom(roomCode, username);

        // Assert
        assertNotNull(response);
        assertEquals(room.getId(), response.getId());
        assertEquals(roomCode, response.getRoomCode());
        assertEquals("Sync Room", response.getName());
        assertEquals("creator", response.getCreatorName());
        assertEquals("python", response.getActiveLanguage());
        assertEquals("print('collab')", response.getActiveContent());
        assertEquals(2L, response.getDocumentVersion());

        verify(participantRepository, times(1)).save(any(RoomParticipant.class));
    }

    @Test
    public void testJoinRoom_ExistingLeftUser() {
        // Arrange
        String roomCode = "abc-defg-hij";
        String username = "returninguser";

        User creator = User.builder()
                .id(UUID.randomUUID())
                .username("creator")
                .build();

        Room room = Room.builder()
                .id(UUID.randomUUID())
                .roomCode(roomCode)
                .name("Sync Room")
                .status("ACTIVE")
                .creator(creator)
                .createdAt(LocalDateTime.now().minusHours(1))
                .build();

        User user = User.builder()
                .id(UUID.randomUUID())
                .username(username)
                .build();

        RoomParticipant existingParticipant = RoomParticipant.builder()
                .id(UUID.randomUUID())
                .room(room)
                .user(user)
                .status("LEFT")
                .role("COLLABORATOR")
                .joinedAt(LocalDateTime.now().minusHours(2))
                .build();

        Document document = Document.builder()
                .id(UUID.randomUUID())
                .room(room)
                .language("javascript")
                .content("console.log('welcome back')")
                .version(5L)
                .build();

        when(roomRepository.findByRoomCode(roomCode)).thenReturn(Optional.of(room));
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(participantRepository.findByRoomIdAndUserId(room.getId(), user.getId())).thenReturn(Optional.of(existingParticipant));
        when(documentRepository.findByRoomId(room.getId())).thenReturn(Optional.of(document));

        // Act
        RoomResponse response = collabService.joinRoom(roomCode, username);

        // Assert
        assertNotNull(response);
        assertEquals("ACTIVE", existingParticipant.getStatus());
        assertNotNull(existingParticipant.getJoinedAt());
        verify(participantRepository, times(1)).save(existingParticipant);
    }

    @Test
    public void testLeaveRoom_Success() {
        // Arrange
        String roomCode = "abc-defg-hij";
        String username = "leavinguser";

        Room room = Room.builder()
                .id(UUID.randomUUID())
                .roomCode(roomCode)
                .build();

        User user = User.builder()
                .id(UUID.randomUUID())
                .username(username)
                .build();

        RoomParticipant participant = RoomParticipant.builder()
                .id(UUID.randomUUID())
                .room(room)
                .user(user)
                .status("ACTIVE")
                .build();

        when(roomRepository.findByRoomCode(roomCode)).thenReturn(Optional.of(room));
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(participantRepository.findByRoomIdAndUserId(room.getId(), user.getId())).thenReturn(Optional.of(participant));

        // Act
        collabService.leaveRoom(roomCode, username);

        // Assert
        assertEquals("LEFT", participant.getStatus());
        assertNotNull(participant.getLeftAt());
        verify(participantRepository, times(1)).save(participant);
    }

    @Test
    public void testUpdateDocument_Success() {
        // Arrange
        String roomCode = "abc-defg-hij";
        String username = "editor";
        
        Room room = Room.builder()
                .id(UUID.randomUUID())
                .roomCode(roomCode)
                .createdAt(LocalDateTime.now().minusMinutes(5))
                .build();

        Document doc = Document.builder()
                .id(UUID.randomUUID())
                .room(room)
                .language("python")
                .content("def initial(): pass")
                .version(10L)
                .build();

        User user = User.builder()
                .id(UUID.randomUUID())
                .username(username)
                .build();

        when(roomRepository.findByRoomCode(roomCode)).thenReturn(Optional.of(room));
        when(documentRepository.findByRoomId(room.getId())).thenReturn(Optional.of(doc));
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        Document updatedDoc = collabService.updateDocument(roomCode, "javascript", "const edited = true;", 10L, username);

        // Assert
        assertNotNull(updatedDoc);
        assertEquals("javascript", updatedDoc.getLanguage());
        assertEquals("const edited = true;", updatedDoc.getContent());
        assertEquals(11L, updatedDoc.getVersion());
        verify(documentRepository, times(1)).save(doc);
        verify(playbackRepository, times(1)).save(any(SessionPlayback.class));
    }

    @Test
    public void testSaveWhiteboardElement_Success() {
        // Arrange
        String roomCode = "abc-defg-hij";
        String elementId = "elem-123";
        Room room = Room.builder()
                .id(UUID.randomUUID())
                .roomCode(roomCode)
                .build();

        when(roomRepository.findByRoomCode(roomCode)).thenReturn(Optional.of(room));
        when(whiteboardElementRepository.save(any(WhiteboardElement.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        WhiteboardElement savedElem = collabService.saveWhiteboardElement(roomCode, elementId, "rectangle", "[10,20]", "#ff0000", 2);

        // Assert
        assertNotNull(savedElem);
        assertEquals(elementId, savedElem.getId());
        assertEquals(room, savedElem.getRoom());
        assertEquals("rectangle", savedElem.getType());
        assertEquals("[10,20]", savedElem.getPointsJson());
        assertEquals("#ff0000", savedElem.getColor());
        assertEquals(2, savedElem.getStrokeWidth());
        verify(whiteboardElementRepository, times(1)).save(any(WhiteboardElement.class));
    }

    @Test
    public void testHandleUserDisconnect_Success() {
        // Arrange
        String username = "disconnectuser";
        Room room = Room.builder()
                .id(UUID.randomUUID())
                .roomCode("abc-defg-hij")
                .build();

        RoomParticipant participant = RoomParticipant.builder()
                .id(UUID.randomUUID())
                .room(room)
                .status("ACTIVE")
                .build();

        List<RoomParticipant> activeParticipants = Collections.singletonList(participant);

        when(participantRepository.findActiveByUsername(username)).thenReturn(activeParticipants);

        // Act
        collabService.handleUserDisconnect(username);

        // Assert
        assertEquals("LEFT", participant.getStatus());
        assertNotNull(participant.getLeftAt());
        verify(participantRepository, times(1)).save(participant);
        verify(messagingTemplate, times(1)).convertAndSend(eq("/topic/room/abc-defg-hij/chat"), any(Map.class));
    }
}
