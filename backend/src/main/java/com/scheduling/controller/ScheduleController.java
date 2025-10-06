package com.scheduling.controller;

import com.scheduling.model.Schedule;
import com.scheduling.repository.ScheduleRepository;
import com.scheduling.service.SchedulingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/schedules")
@CrossOrigin(origins = "http://localhost:3000")
public class ScheduleController {
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    @Autowired
    private SchedulingService schedulingService;
    
    @GetMapping
    public ResponseEntity<List<Schedule>> getAllSchedules() {
        List<Schedule> schedules = scheduleRepository.findAll();
        return ResponseEntity.ok(schedules);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Schedule> getScheduleById(@PathVariable Long id) {
        Optional<Schedule> schedule = scheduleRepository.findById(id);
        return schedule.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<Schedule> createSchedule(@Valid @RequestBody Schedule schedule) {
        try {
            Schedule savedSchedule = scheduleRepository.save(schedule);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedSchedule);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Schedule> updateSchedule(@PathVariable Long id, @Valid @RequestBody Schedule scheduleDetails) {
        Optional<Schedule> optionalSchedule = scheduleRepository.findById(id);
        
        if (optionalSchedule.isPresent()) {
            Schedule schedule = optionalSchedule.get();
            schedule.setDate(scheduleDetails.getDate());
            schedule.setStartTime(scheduleDetails.getStartTime());
            schedule.setEndTime(scheduleDetails.getEndTime());
            schedule.setDayOfWeek(scheduleDetails.getDayOfWeek());
            schedule.setTeacher(scheduleDetails.getTeacher());
            schedule.setClassroom(scheduleDetails.getClassroom());
            schedule.setSubject(scheduleDetails.getSubject());
            schedule.setNotes(scheduleDetails.getNotes());
            schedule.setRecurring(scheduleDetails.isRecurring());
            
            Schedule updatedSchedule = scheduleRepository.save(schedule);
            return ResponseEntity.ok(updatedSchedule);
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSchedule(@PathVariable Long id) {
        if (scheduleRepository.existsById(id)) {
            scheduleRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/date/{date}")
    public ResponseEntity<List<Schedule>> getSchedulesByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Schedule> schedules = scheduleRepository.findByDate(date);
        return ResponseEntity.ok(schedules);
    }
    
    @GetMapping("/week")
    public ResponseEntity<List<Schedule>> getSchedulesForWeek(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Schedule> schedules = scheduleRepository.findSchedulesBetweenDates(startDate, endDate);
        return ResponseEntity.ok(schedules);
    }
    
    @PostMapping("/generate")
    public ResponseEntity<List<Schedule>> generateSchedule(@RequestBody List<SchedulingService.SchedulingRequest> requests) {
        try {
            List<Schedule> generatedSchedules = schedulingService.generateConflictFreeSchedule(requests);
            return ResponseEntity.ok(generatedSchedules);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/generate-weekly")
    public ResponseEntity<List<Schedule>> generateWeeklySchedule(
            @RequestBody List<SchedulingService.SchedulingRequest> requests,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        try {
            List<Schedule> generatedSchedules = schedulingService.generateWeeklySchedule(requests, weekStart);
            return ResponseEntity.ok(generatedSchedules);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getScheduleStatistics(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        try {
            Map<String, Object> statistics = schedulingService.getScheduleStatistics(startDate, endDate);
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
