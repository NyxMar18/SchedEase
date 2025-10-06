package com.scheduling.controller;

import com.scheduling.model.Classroom;
import com.scheduling.repository.ClassroomRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/classrooms")
@CrossOrigin(origins = "http://localhost:3000")
public class ClassroomController {
    
    @Autowired
    private ClassroomRepository classroomRepository;
    
    @GetMapping
    public ResponseEntity<List<Classroom>> getAllClassrooms() {
        List<Classroom> classrooms = classroomRepository.findAll();
        return ResponseEntity.ok(classrooms);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Classroom> getClassroomById(@PathVariable Long id) {
        Optional<Classroom> classroom = classroomRepository.findById(id);
        return classroom.map(ResponseEntity::ok)
                       .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Classroom> createClassroom(@Valid @RequestBody Classroom classroom) {
        try {
            Classroom savedClassroom = classroomRepository.save(classroom);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedClassroom);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Classroom> updateClassroom(@PathVariable Long id, @Valid @RequestBody Classroom classroomDetails) {
        Optional<Classroom> optionalClassroom = classroomRepository.findById(id);
        
        if (optionalClassroom.isPresent()) {
            Classroom classroom = optionalClassroom.get();
            classroom.setRoomName(classroomDetails.getRoomName());
            classroom.setRoomType(classroomDetails.getRoomType());
            classroom.setCapacity(classroomDetails.getCapacity());
            classroom.setLocation(classroomDetails.getLocation());
            classroom.setDescription(classroomDetails.getDescription());
            
            Classroom updatedClassroom = classroomRepository.save(classroom);
            return ResponseEntity.ok(updatedClassroom);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteClassroom(@PathVariable Long id) {
        if (classroomRepository.existsById(id)) {
            classroomRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/type/{roomType}")
    public ResponseEntity<List<Classroom>> getClassroomsByType(@PathVariable String roomType) {
        List<Classroom> classrooms = classroomRepository.findByRoomType(roomType);
        return ResponseEntity.ok(classrooms);
    }
    
    @GetMapping("/capacity/{minCapacity}")
    public ResponseEntity<List<Classroom>> getClassroomsByMinCapacity(@PathVariable Integer minCapacity) {
        List<Classroom> classrooms = classroomRepository.findByCapacityGreaterThanEqual(minCapacity);
        return ResponseEntity.ok(classrooms);
    }
}
