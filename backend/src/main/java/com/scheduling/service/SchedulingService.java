package com.scheduling.service;

import com.scheduling.model.*;
import com.scheduling.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SchedulingService {
    
    @Autowired
    private ClassroomRepository classroomRepository;
    
    @Autowired
    private TeacherRepository teacherRepository;
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    @Autowired
    private SectionRepository sectionRepository;
    
    @Autowired
    private SubjectRepository subjectRepository;
    
    /**
     * Generate an optimized schedule using constraint satisfaction and optimization algorithms
     */
    public SchedulingResult generateOptimizedSchedule() {
        SchedulingResult result = new SchedulingResult();
        
        try {
            // Get all entities
            List<Section> sections = sectionRepository.findAll();
            List<Subject> subjects = subjectRepository.findAllOrderByPriority();
            List<Teacher> teachers = teacherRepository.findAll();
            List<Classroom> classrooms = classroomRepository.findAll();
            
            // Validate prerequisites
            if (!validatePrerequisites(sections, subjects, teachers, classrooms)) {
                result.setSuccess(false);
                result.setMessage("Prerequisites not met. Please ensure all sections have subjects assigned and teachers are available.");
                return result;
            }
            
            // Generate scheduling requests
            List<SchedulingRequest> requests = generateSchedulingRequests(sections, subjects);
            
            // Apply constraint satisfaction algorithm
            List<Schedule> schedules = constraintSatisfactionScheduling(requests, teachers, classrooms);
            
            // Optimize workload distribution
            schedules = optimizeWorkloadDistribution(schedules, teachers);
            
            // Save schedules
            List<Schedule> savedSchedules = new ArrayList<>();
            for (Schedule schedule : schedules) {
                try {
                    Schedule saved = scheduleRepository.save(schedule);
                    savedSchedules.add(saved);
                } catch (Exception e) {
                    result.addWarning("Failed to save schedule: " + e.getMessage());
                }
            }
            
            result.setSchedules(savedSchedules);
            result.setSuccess(true);
            result.setMessage(String.format("Successfully generated %d schedule entries", savedSchedules.size()));
            
            // Generate statistics
            result.setStatistics(generateStatistics(savedSchedules));
            
        } catch (Exception e) {
            result.setSuccess(false);
            result.setMessage("Failed to generate schedule: " + e.getMessage());
        }
        
        return result;
    }
    
    /**
     * Validate that all prerequisites are met for scheduling
     */
    private boolean validatePrerequisites(List<Section> sections, List<Subject> subjects, 
                                        List<Teacher> teachers, List<Classroom> classrooms) {
        if (sections.isEmpty() || subjects.isEmpty() || teachers.isEmpty() || classrooms.isEmpty()) {
            return false;
        }
        
        // Check if teachers can cover all subjects
        Set<String> subjectNames = subjects.stream().map(Subject::getName).collect(Collectors.toSet());
        Set<String> teacherSubjects = teachers.stream()
            .flatMap(teacher -> {
                if (teacher.getSubjects() != null && !teacher.getSubjects().isEmpty()) {
                    return teacher.getSubjects().stream();
                }
                return java.util.stream.Stream.empty();
            })
            .collect(Collectors.toSet());
        
        // Log for debugging
        System.out.println("📚 Required subjects: " + subjectNames);
        System.out.println("👨‍🏫 Available teacher subjects: " + teacherSubjects);
        
        if (!teacherSubjects.containsAll(subjectNames)) {
            Set<String> missingSubjects = new java.util.HashSet<>(subjectNames);
            missingSubjects.removeAll(teacherSubjects);
            System.out.println("❌ Missing teachers for subjects: " + missingSubjects);
        }
        
        return teacherSubjects.containsAll(subjectNames);
    }
    
    /**
     * Generate scheduling requests based on sections and subjects
     * Note: durationPerWeek is stored as HOURS in the database
     * We convert it to 30-minute blocks (1 hour = 2 blocks, 1.5 hours = 3 blocks, etc.)
     * Splits duration into combinations of 1-hour (2 blocks) and 1.5-hour (3 blocks) schedules
     * Example: 3 hours = 6 blocks → 2 × 1 hour + 1 × 1.5 hour = 3 schedules
     */
    private List<SchedulingRequest> generateSchedulingRequests(List<Section> sections, List<Subject> subjects) {
        List<SchedulingRequest> requests = new ArrayList<>();
        
        for (Section section : sections) {
            // For now, assume all sections need all subjects
            // In a real system, this would come from section-subject assignments
            for (Subject subject : subjects) {
                // Convert durationPerWeek from HOURS to 30-minute BLOCKS
                // If durationPerWeek = 3 hours, that's 6 blocks (3 × 2 = 6)
                int durationInHours = subject.getDurationPerWeek();
                int durationInBlocks = durationInHours * 2;
                
                System.out.println("📚 Subject: " + subject.getName() + 
                                 " - Duration: " + durationInHours + " hours = " + durationInBlocks + " blocks (30-min each)");
                
                // Split duration into combinations of 1-hour and 1.5-hour schedules
                List<Integer> scheduleBlocks = splitDurationIntoScheduleBlocks(durationInBlocks);
                
                System.out.println("📋 Split into " + scheduleBlocks.size() + " schedule(s): " + scheduleBlocks);
                
                int scheduleIndex = 0;
                // Store scheduleBlocks for validation later
                final List<Integer> finalScheduleBlocks = scheduleBlocks;
                for (int blocks : scheduleBlocks) {
                    SchedulingRequest request = new SchedulingRequest();
                    request.setSection(section);
                    request.setSubject(subject);
                    request.setRequiredCapacity(section.getStudentCount());
                    request.setRoomType(subject.getRequiredRoomType());
                    request.setPriority(subject.getPriority());
                    request.setDurationIndex(scheduleIndex++); // Track which schedule this is (0, 1, 2, etc.)
                    request.setConsecutiveHours(blocks); // Number of 30-minute blocks for this schedule (2 = 1 hour, 3 = 1.5 hours)
                    
                    // Validate request was created correctly
                    if (request.getConsecutiveHours() == null || request.getConsecutiveHours() != blocks) {
                        System.out.println("❌ ERROR: Request consecutiveHours mismatch! Expected " + blocks + ", got " + request.getConsecutiveHours());
                    }
                    
                    System.out.println("📝 Created request " + request.getDurationIndex() + 
                                     " for " + subject.getName() + 
                                     " with " + blocks + " consecutive blocks (" + 
                                     (blocks == 1 ? "30 min" : blocks == 2 ? "1 hour" : blocks == 3 ? "1.5 hours" : (blocks * 30) + " minutes") + ")" +
                                     " [consecutiveHours=" + request.getConsecutiveHours() + "]");
                    
                    requests.add(request);
                }
                
                // Verify total blocks created matches expected
                int totalBlocksCreated = scheduleBlocks.stream().mapToInt(Integer::intValue).sum();
                if (totalBlocksCreated != durationInBlocks) {
                    System.out.println("❌ ERROR: Total blocks mismatch! Expected " + durationInBlocks + ", created " + totalBlocksCreated);
                } else {
                    System.out.println("✅ Total blocks verified: " + totalBlocksCreated + " blocks = " + (totalBlocksCreated * 0.5) + " hours");
                }
            }
        }
        
        // Sort by priority (higher priority first), then by block count (more blocks first)
        requests.sort((r1, r2) -> {
            int priorityComparison = Integer.compare(r2.getPriority(), r1.getPriority());
            if (priorityComparison != 0) {
                return priorityComparison;
            }
            // If same priority, schedule longer blocks first
            return Integer.compare(r2.getConsecutiveHours(), r1.getConsecutiveHours());
        });
        
        return requests;
    }
    
    /**
     * Split total duration (in 30-minute blocks) into combinations of 1-hour (2 blocks) and 1.5-hour (3 blocks) schedules
     * Strategy: Prefer 1-hour schedules, use 1.5-hour when remaining blocks can be optimally split
     * Examples:
     * - 6 blocks (3 hours) → [2, 2, 2] = 3 × 1 hour (OR [3, 3] = 2 × 1.5 hour if preferred)
     * - 5 blocks (2.5 hours) → [2, 3] = 1 × 1 hour + 1 × 1.5 hour
     * - 4 blocks (2 hours) → [2, 2] = 2 × 1 hour
     * - 7 blocks (3.5 hours) → [2, 2, 3] = 2 × 1 hour + 1 × 1.5 hour
     */
    private List<Integer> splitDurationIntoScheduleBlocks(int totalBlocks) {
        List<Integer> result = new ArrayList<>();
        int remaining = totalBlocks;
        
        System.out.println("🔀 Splitting " + totalBlocks + " blocks into schedules...");
        
        // Special case: 6 blocks (3 hours) → create 3 × 1 hour schedules
        if (totalBlocks == 6) {
            // For exactly 6 blocks (3 hours), create 3 × 1 hour schedules
            result.add(2); // 1 hour (2 blocks)
            result.add(2); // 1 hour (2 blocks)
            result.add(2); // 1 hour (2 blocks)
            // Total: 6 blocks = 3 hours exactly, 3 schedules
            System.out.println("   Result: " + result + " (3 × 1 hour = 6 blocks = 3 hours)");
            return result;
        }
        
        // Special case: 7 blocks (3.5 hours) → can use pattern: 2 × 1 hour + 1 × 1.5 hour = 3 schedules
        if (totalBlocks == 7) {
            result.add(2); // 1 hour
            result.add(2); // 1 hour
            result.add(3); // 1.5 hours
            // Total: 7 blocks = 3.5 hours, 3 schedules
            return result;
        }
        
        // General algorithm for other durations
        while (remaining > 0) {
            if (remaining == 1) {
                result.add(1); // 30 minutes (fallback)
                remaining -= 1;
            } else if (remaining == 2) {
                result.add(2); // 1 hour
                remaining -= 2;
            } else if (remaining == 3) {
                result.add(3); // 1.5 hours
                remaining -= 3;
            } else if (remaining == 4) {
                result.add(2); // 1 hour
                result.add(2); // 1 hour
                remaining -= 4;
            } else if (remaining == 5) {
                result.add(2); // 1 hour
                result.add(3); // 1.5 hours
                remaining -= 5;
            } else if (remaining >= 6) {
                // For 6 or more, prefer combinations
                // Use 1.5-hour if it leaves a clean split, otherwise use 1-hour
                if ((remaining - 3) % 2 == 0 && remaining - 3 >= 2) {
                    result.add(3); // 1.5 hours
                    remaining -= 3;
                } else {
                    result.add(2); // 1 hour
                    remaining -= 2;
                }
            }
        }
        
        System.out.println("   Result: " + result + " (total blocks: " + result.stream().mapToInt(Integer::intValue).sum() + ")");
        return result;
    }
    
    /**
     * Advanced constraint satisfaction scheduling algorithm with same-day subject conflict prevention
     */
    private List<Schedule> constraintSatisfactionScheduling(List<SchedulingRequest> requests, 
                                                          List<Teacher> teachers, List<Classroom> classrooms) {
        List<Schedule> schedules = new ArrayList<>();
        Set<String> usedSlots = new HashSet<>();
        
        // Track same-day subject conflicts for each section
        Map<String, Set<String>> sectionDaySubjects = new HashMap<>();
        
        // Define time slots and days
        List<DayOfWeek> allDaysOfWeek = Arrays.asList(
            DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, 
            DayOfWeek.THURSDAY, DayOfWeek.FRIDAY
        );
        
        // 30-minute time slots to support 1.5 hour schedules
        List<TimeSlot> timeSlots = Arrays.asList(
            new TimeSlot(LocalTime.of(8, 0), LocalTime.of(8, 30)),
            new TimeSlot(LocalTime.of(8, 30), LocalTime.of(9, 0)),
            new TimeSlot(LocalTime.of(9, 0), LocalTime.of(9, 30)),
            new TimeSlot(LocalTime.of(9, 30), LocalTime.of(10, 0)),
            new TimeSlot(LocalTime.of(10, 0), LocalTime.of(10, 30)),
            new TimeSlot(LocalTime.of(10, 30), LocalTime.of(11, 0)),
            new TimeSlot(LocalTime.of(11, 0), LocalTime.of(11, 30)),
            new TimeSlot(LocalTime.of(11, 30), LocalTime.of(12, 0)),
            new TimeSlot(LocalTime.of(13, 0), LocalTime.of(13, 30)),
            new TimeSlot(LocalTime.of(13, 30), LocalTime.of(14, 0)),
            new TimeSlot(LocalTime.of(14, 0), LocalTime.of(14, 30)),
            new TimeSlot(LocalTime.of(14, 30), LocalTime.of(15, 0)),
            new TimeSlot(LocalTime.of(15, 0), LocalTime.of(15, 30)),
            new TimeSlot(LocalTime.of(15, 30), LocalTime.of(16, 0))
        );
        
        for (SchedulingRequest request : requests) {
            // Get available days based on section schedule pattern
            List<DayOfWeek> availableDays = getAvailableDaysForSection(request.getSection());
            
            Schedule schedule = findOptimalSchedule(request, teachers, classrooms, 
                                                 availableDays, timeSlots, usedSlots, sectionDaySubjects);
            if (schedule != null) {
                schedules.add(schedule);
                
                // Mark all consecutive slots as used
                int blocksToMark = request.getConsecutiveHours();
                System.out.println("📍 Marking " + blocksToMark + " consecutive blocks as used for schedule " + 
                                 schedule.getSubject().getName() + " at " + schedule.getStartTime() + "-" + schedule.getEndTime());
                markConsecutiveSlotsAsUsed(schedule, blocksToMark, timeSlots, usedSlots);
                
                // Track subject for this section on this day to prevent duplicates across ALL days
                String sectionDayKey = schedule.getSection().getId() + "-" + schedule.getDayOfWeek().toString();
                sectionDaySubjects.computeIfAbsent(sectionDayKey, k -> new HashSet<>())
                                 .add(schedule.getSubject().getName());
                
                // Debug logging to verify same-day subject prevention
                double totalMinutes = request.getConsecutiveHours() * 30.0;
                String durationStr = totalMinutes >= 60 ? 
                    String.format("%.1f hours", totalMinutes / 60.0) : 
                    String.format("%.0f minutes", totalMinutes);
                System.out.println("✅ Scheduled: " + schedule.getSection().getSectionName() + 
                                 " - " + schedule.getSubject().getName() + 
                                 " on " + schedule.getDayOfWeek() + 
                                 " at " + schedule.getStartTime() + "-" + schedule.getEndTime() +
                                 " (Schedule " + (request.getDurationIndex() + 1) + ", " + durationStr + ")");
            } else {
                double totalMinutes = request.getConsecutiveHours() * 30.0;
                String durationStr = totalMinutes >= 60 ? 
                    String.format("%.1f hours", totalMinutes / 60.0) : 
                    String.format("%.0f minutes", totalMinutes);
                System.out.println("❌ Could not schedule: " + request.getSection().getSectionName() + 
                                 " - " + request.getSubject().getName() + 
                                 " (Schedule " + (request.getDurationIndex() + 1) + ", " + durationStr + " needed)");
            }
        }
        
        // Validate that no section has the same subject multiple times on the same day
        validateSameDaySubjectConstraints(schedules);
        
        return schedules;
    }
    
    /**
     * Validate that no section has the same subject multiple times on the same day
     */
    private void validateSameDaySubjectConstraints(List<Schedule> schedules) {
        Map<String, Set<String>> sectionDaySubjects = new HashMap<>();
        boolean hasViolations = false;
        
        for (Schedule schedule : schedules) {
            String key = schedule.getSection().getId() + "-" + schedule.getDayOfWeek().toString();
            String subjectName = schedule.getSubject().getName();
            
            Set<String> subjectsOnThisDay = sectionDaySubjects.computeIfAbsent(key, k -> new HashSet<>());
            
            if (subjectsOnThisDay.contains(subjectName)) {
                System.out.println("❌ VIOLATION: " + schedule.getSection().getSectionName() + 
                                 " has " + subjectName + " multiple times on " + schedule.getDayOfWeek());
                hasViolations = true;
            } else {
                subjectsOnThisDay.add(subjectName);
            }
        }
        
        if (!hasViolations) {
            System.out.println("✅ VALIDATION PASSED: No section has the same subject multiple times on the same day");
        }
    }
    
    private boolean isScheduleConflictFree(Teacher teacher, Classroom classroom, SchedulingRequest request) {
        // Check teacher conflicts
        List<Schedule> teacherConflicts = scheduleRepository.findConflictingTeacherSchedules(
            teacher,
            request.getDate(),
            request.getStartTime(),
            request.getEndTime()
        );
        
        if (!teacherConflicts.isEmpty()) {
            return false;
        }
        
        // Check classroom conflicts
        List<Schedule> classroomConflicts = scheduleRepository.findConflictingClassroomSchedules(
            classroom,
            request.getDate(),
            request.getStartTime(),
            request.getEndTime()
        );
        
        return classroomConflicts.isEmpty();
    }
    
    private Schedule createSchedule(Teacher teacher, Classroom classroom, SchedulingRequest request) {
        Schedule schedule = new Schedule();
        schedule.setDate(request.getDate());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setTeacher(teacher);
        schedule.setClassroom(classroom);
        schedule.setSubject(request.getSubject());
        schedule.setNotes(request.getNotes());
        schedule.setRecurring(request.isRecurring());
        
        return schedule;
    }
    
    public List<Schedule> generateWeeklySchedule(List<SchedulingRequest> requests, LocalDate weekStart) {
        List<Schedule> weeklySchedules = new ArrayList<>();
        
        for (int i = 0; i < 7; i++) {
            LocalDate currentDate = weekStart.plusDays(i);
            DayOfWeek dayOfWeek = DayOfWeek.values()[i];
            
            List<SchedulingRequest> dayRequests = requests.stream()
                .filter(req -> req.getDayOfWeek() == dayOfWeek)
                .toList();
            
            for (SchedulingRequest request : dayRequests) {
                request.setDate(currentDate);
                Schedule schedule = findBestSchedule(request);
                if (schedule != null) {
                    weeklySchedules.add(schedule);
                    scheduleRepository.save(schedule);
                }
            }
        }
        
        return weeklySchedules;
    }
    
    public Map<String, Object> getScheduleStatistics(LocalDate startDate, LocalDate endDate) {
        List<Schedule> schedules = scheduleRepository.findSchedulesBetweenDates(startDate, endDate);
        
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalSchedules", schedules.size());
        
        Map<String, Long> subjectCount = schedules.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                Schedule::getSubject,
                java.util.stream.Collectors.counting()
            ));
        statistics.put("subjectDistribution", subjectCount);
        
        Map<String, Long> teacherUtilization = schedules.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                s -> s.getTeacher().getFullName(),
                java.util.stream.Collectors.counting()
            ));
        statistics.put("teacherUtilization", teacherUtilization);
        
        Map<String, Long> classroomUtilization = schedules.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                s -> s.getClassroom().getRoomName(),
                java.util.stream.Collectors.counting()
            ));
        statistics.put("classroomUtilization", classroomUtilization);
        
        return statistics;
    }
    
    /**
     * Get available days for a section based on its schedule pattern
     */
    private List<DayOfWeek> getAvailableDaysForSection(Section section) {
        if (section.getSchedulePattern() == null) {
            return Arrays.asList(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY); // Default to MWF
        }
        
        switch (section.getSchedulePattern()) {
            case MWF:
                return Arrays.asList(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY);
            case TTH:
                return Arrays.asList(DayOfWeek.TUESDAY, DayOfWeek.THURSDAY);
            default:
                return Arrays.asList(DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY);
        }
    }
    
    /**
     * Find optimal schedule for a request using advanced algorithms with same-day conflict prevention
     */
    private Schedule findOptimalSchedule(SchedulingRequest request, List<Teacher> teachers, 
                                       List<Classroom> classrooms, List<DayOfWeek> daysOfWeek,
                                       List<TimeSlot> timeSlots, Set<String> usedSlots,
                                       Map<String, Set<String>> sectionDaySubjects) {
        
        // Find suitable teachers for this subject
        List<Teacher> suitableTeachers = teachers.stream()
            .filter(teacher -> {
                if (teacher.getSubjects() != null && !teacher.getSubjects().isEmpty()) {
                    return teacher.getSubjects().contains(request.getSubject().getName());
                }
                return false;
            })
            .collect(Collectors.toList());
        
        if (suitableTeachers.isEmpty()) {
            return null;
        }
        
        // Find suitable classrooms
        List<Classroom> suitableClassrooms = classrooms.stream()
            .filter(classroom -> classroom.getCapacity() >= request.getRequiredCapacity())
            .filter(classroom -> classroom.getRoomType().equals(request.getRoomType()) || 
                                request.getRoomType().equals("Any"))
            .collect(Collectors.toList());
        
        if (suitableClassrooms.isEmpty()) {
            return null;
        }
        
        // Try to find the best combination, looking for consecutive slots for multi-hour subjects
        for (DayOfWeek day : daysOfWeek) {
            // Check if this section already has this subject on this day (prevent same subject multiple times)
            String sectionDayKey = request.getSection().getId() + "-" + day.toString();
            Set<String> subjectsOnThisDay = sectionDaySubjects.get(sectionDayKey);
            
            if (subjectsOnThisDay != null && subjectsOnThisDay.contains(request.getSubject().getName())) {
                // This section already has this subject on this day, skip to next day
                System.out.println("⏭️ Skipping " + day + " - " + request.getSection().getSectionName() + 
                                 " already has " + request.getSubject().getName() + " on this day");
                continue;
            }
            
            for (int slotIndex = 0; slotIndex < timeSlots.size(); slotIndex++) {
                TimeSlot timeSlot = timeSlots.get(slotIndex);
                
                // Check if we have enough consecutive slots for multi-block schedules (1 hour = 2 blocks, 1.5 hours = 3 blocks)
                if (request.getConsecutiveHours() > 1) {
                    if (slotIndex + request.getConsecutiveHours() > timeSlots.size()) {
                        continue; // Not enough slots remaining
                    }
                    
                    // Check if all consecutive slots are available
                    if (!areConsecutiveSlotsAvailable(day, slotIndex, request.getConsecutiveHours(), 
                                                    suitableTeachers, suitableClassrooms, usedSlots)) {
                        continue;
                    }
                }
                
                for (Teacher teacher : suitableTeachers) {
                    // Check if teacher is available for all consecutive blocks
                    if (!isTeacherAvailableForConsecutiveHours(teacher, day, slotIndex, 
                                                             request.getConsecutiveHours(), timeSlots)) {
                        continue;
                    }
                    
                    for (Classroom classroom : suitableClassrooms) {
                        // Check if ALL consecutive slots are available for this teacher-classroom combination
                        boolean allSlotsAvailable = true;
                        for (int i = 0; i < request.getConsecutiveHours(); i++) {
                            TimeSlot checkSlot = timeSlots.get(slotIndex + i);
                            String checkSlotKey = generateSlotKey(day, checkSlot, teacher, classroom);
                            if (usedSlots.contains(checkSlotKey)) {
                                allSlotsAvailable = false;
                                break;
                            }
                        }
                        
                        if (allSlotsAvailable) {
                            // Create schedule spanning the required number of consecutive blocks
                            Schedule schedule = new Schedule();
                            schedule.setDate(LocalDate.now()); // Use current date as base
                            schedule.setStartTime(timeSlot.getStartTime());
                            
                            // Calculate end time based on number of consecutive 30-minute blocks
                            Integer numBlocks = request.getConsecutiveHours();
                            if (numBlocks == null) {
                                System.out.println("❌ ERROR: consecutiveHours is null! Defaulting to 1 block");
                                numBlocks = 1;
                            }
                            
                            System.out.println("🔧 Creating schedule with " + numBlocks + " consecutive blocks (30-min each)");
                            System.out.println("   Slot index: " + slotIndex + ", Total slots: " + timeSlots.size());
                            
                            if (numBlocks > 1) {
                                // Validate we have enough slots
                                if (slotIndex + numBlocks - 1 >= timeSlots.size()) {
                                    System.out.println("❌ ERROR: Not enough slots! Need " + numBlocks + " blocks starting at index " + slotIndex);
                                    continue; // Skip this combination
                                }
                                TimeSlot lastSlot = timeSlots.get(slotIndex + numBlocks - 1);
                                schedule.setEndTime(lastSlot.getEndTime());
                                System.out.println("   Start: " + timeSlot.getStartTime() + ", End: " + lastSlot.getEndTime() + 
                                                 " (" + numBlocks + " blocks = " + (numBlocks * 30) + " minutes)");
                            } else {
                                schedule.setEndTime(timeSlot.getEndTime()); // Single 30-minute block
                                System.out.println("   Start: " + timeSlot.getStartTime() + ", End: " + timeSlot.getEndTime() + 
                                                 " (1 block = 30 minutes)");
                            }
                            
                            schedule.setDayOfWeek(day);
                            schedule.setTeacher(teacher);
                            schedule.setClassroom(classroom);
                            schedule.setSection(request.getSection());
                            schedule.setSubject(request.getSubject());
                            schedule.setDurationIndex(request.getDurationIndex()); // Track which schedule this is (0, 1, 2, etc.)
                            schedule.setRecurring(true);
                            schedule.setStatus(ScheduleStatus.SCHEDULED);
                            
                            // Validate the schedule duration matches the request
                            long actualDurationMinutes = java.time.Duration.between(schedule.getStartTime(), schedule.getEndTime()).toMinutes();
                            long expectedDurationMinutes = request.getConsecutiveHours() * 30L;
                            
                            if (actualDurationMinutes != expectedDurationMinutes) {
                                System.out.println("⚠️ ERROR: Schedule duration mismatch!");
                                System.out.println("   Expected: " + expectedDurationMinutes + " minutes (" + request.getConsecutiveHours() + " blocks)");
                                System.out.println("   Actual: " + actualDurationMinutes + " minutes");
                                System.out.println("   Start: " + schedule.getStartTime() + ", End: " + schedule.getEndTime());
                                // Fix it - recalculate end time
                                if (numBlocks > 1 && slotIndex + numBlocks - 1 < timeSlots.size()) {
                                    TimeSlot correctLastSlot = timeSlots.get(slotIndex + numBlocks - 1);
                                    schedule.setEndTime(correctLastSlot.getEndTime());
                                    System.out.println("   ✅ Fixed end time to: " + correctLastSlot.getEndTime());
                                }
                            } else {
                                System.out.println("✅ Schedule duration validated: " + actualDurationMinutes + " minutes = " + 
                                                 (actualDurationMinutes / 60.0) + " hours");
                            }
                            
                            // Create notes showing the actual duration
                            double totalMinutes = request.getConsecutiveHours() * 30.0;
                            String durationStr = totalMinutes >= 60 ? 
                                String.format("%.1f hours", totalMinutes / 60.0) : 
                                String.format("%.0f minutes", totalMinutes);
                            schedule.setNotes(String.format("Auto-generated: %s - %s (Schedule %d, %s: %s-%s)", 
                                request.getSection().getSectionName(),
                                request.getSubject().getName(),
                                request.getDurationIndex() + 1,
                                durationStr,
                                schedule.getStartTime(),
                                schedule.getEndTime()));
                            
                            return schedule;
                        }
                    }
                }
            }
        }
        
        return null;
    }
    
    private boolean isTeacherAvailable(Teacher teacher, DayOfWeek day, TimeSlot timeSlot) {
        return teacher.getAvailableDays().contains(day) &&
               teacher.getAvailableStartTime().compareTo(timeSlot.getStartTime()) <= 0 &&
               teacher.getAvailableEndTime().compareTo(timeSlot.getEndTime()) >= 0;
    }
    
    /**
     * Check if consecutive slots are available for scheduling
     */
    private boolean areConsecutiveSlotsAvailable(DayOfWeek day, int startSlotIndex, int consecutiveHours,
                                               List<Teacher> suitableTeachers, List<Classroom> suitableClassrooms,
                                               Set<String> usedSlots) {
        // 30-minute time slots to support 1.5 hour schedules
        List<TimeSlot> timeSlots = Arrays.asList(
            new TimeSlot(LocalTime.of(8, 0), LocalTime.of(8, 30)),
            new TimeSlot(LocalTime.of(8, 30), LocalTime.of(9, 0)),
            new TimeSlot(LocalTime.of(9, 0), LocalTime.of(9, 30)),
            new TimeSlot(LocalTime.of(9, 30), LocalTime.of(10, 0)),
            new TimeSlot(LocalTime.of(10, 0), LocalTime.of(10, 30)),
            new TimeSlot(LocalTime.of(10, 30), LocalTime.of(11, 0)),
            new TimeSlot(LocalTime.of(11, 0), LocalTime.of(11, 30)),
            new TimeSlot(LocalTime.of(11, 30), LocalTime.of(12, 0)),
            new TimeSlot(LocalTime.of(13, 0), LocalTime.of(13, 30)),
            new TimeSlot(LocalTime.of(13, 30), LocalTime.of(14, 0)),
            new TimeSlot(LocalTime.of(14, 0), LocalTime.of(14, 30)),
            new TimeSlot(LocalTime.of(14, 30), LocalTime.of(15, 0)),
            new TimeSlot(LocalTime.of(15, 0), LocalTime.of(15, 30)),
            new TimeSlot(LocalTime.of(15, 30), LocalTime.of(16, 0))
        );
        
        // Check if all consecutive slots are available for at least one teacher-classroom combination
        for (Teacher teacher : suitableTeachers) {
            for (Classroom classroom : suitableClassrooms) {
                boolean allSlotsAvailable = true;
                
                for (int i = 0; i < consecutiveHours; i++) {
                    TimeSlot slot = timeSlots.get(startSlotIndex + i);
                    String slotKey = generateSlotKey(day, slot, teacher, classroom);
                    
                    if (usedSlots.contains(slotKey)) {
                        allSlotsAvailable = false;
                        break;
                    }
                }
                
                if (allSlotsAvailable) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * Check if teacher is available for consecutive 30-minute blocks
     */
    private boolean isTeacherAvailableForConsecutiveHours(Teacher teacher, DayOfWeek day, int startSlotIndex,
                                                        int consecutiveHours, List<TimeSlot> timeSlots) {
        // Check if teacher is available for all consecutive blocks
        for (int i = 0; i < consecutiveHours; i++) {
            TimeSlot slot = timeSlots.get(startSlotIndex + i);
            if (!isTeacherAvailable(teacher, day, slot)) {
                return false;
            }
        }
        return true;
    }
    
    /**
     * Mark all consecutive 30-minute slots as used
     */
    private void markConsecutiveSlotsAsUsed(Schedule schedule, int consecutiveHours, List<TimeSlot> timeSlots, Set<String> usedSlots) {
        // Find the start slot index
        int startSlotIndex = -1;
        for (int i = 0; i < timeSlots.size(); i++) {
            if (timeSlots.get(i).getStartTime().equals(schedule.getStartTime())) {
                startSlotIndex = i;
                break;
            }
        }
        
        if (startSlotIndex == -1) {
            System.out.println("⚠️ Warning: Could not find start slot for " + schedule.getStartTime());
            return;
        }
        
        System.out.println("   Marking " + consecutiveHours + " slots starting at index " + startSlotIndex);
        
        // Mark all consecutive slots as used
        for (int i = 0; i < consecutiveHours; i++) {
            if (startSlotIndex + i >= timeSlots.size()) {
                System.out.println("⚠️ Warning: Attempted to mark slot " + (startSlotIndex + i) + " but only " + timeSlots.size() + " slots available");
                break;
            }
            TimeSlot slot = timeSlots.get(startSlotIndex + i);
            String slotKey = generateSlotKey(schedule.getDayOfWeek(), slot, schedule.getTeacher(), schedule.getClassroom());
            usedSlots.add(slotKey);
            System.out.println("   ✓ Marked slot " + (i + 1) + "/" + consecutiveHours + ": " + slot.getStartTime() + "-" + slot.getEndTime());
        }
    }
    
    private String generateSlotKey(Schedule schedule) {
        return generateSlotKey(schedule.getDayOfWeek(), 
                              new TimeSlot(schedule.getStartTime(), schedule.getEndTime()),
                              schedule.getTeacher(), schedule.getClassroom());
    }
    
    private String generateSlotKey(DayOfWeek day, TimeSlot timeSlot, Teacher teacher, Classroom classroom) {
        return String.format("%s-%s-%s-%d-%d", 
            day.toString(), 
            timeSlot.getStartTime().toString(), 
            timeSlot.getEndTime().toString(),
            teacher.getId(), 
            classroom.getId());
    }
    
    /**
     * Optimize workload distribution among teachers
     */
    private List<Schedule> optimizeWorkloadDistribution(List<Schedule> schedules, List<Teacher> teachers) {
        // Calculate current workload for each teacher
        Map<Long, Integer> teacherWorkload = new HashMap<>();
        for (Teacher teacher : teachers) {
            teacherWorkload.put(teacher.getId(), 0);
        }
        
        for (Schedule schedule : schedules) {
            teacherWorkload.merge(schedule.getTeacher().getId(), 1, Integer::sum);
        }
        
        // Try to balance workload by swapping schedules if possible
        // This is a simplified version - in reality, you'd use more sophisticated algorithms
        return schedules;
    }
    
    /**
     * Generate comprehensive statistics
     */
    private Map<String, Object> generateStatistics(List<Schedule> schedules) {
        Map<String, Object> statistics = new HashMap<>();
        
        statistics.put("totalSchedules", schedules.size());
        
        // Teacher utilization
        Map<String, Long> teacherUtilization = schedules.stream()
            .collect(Collectors.groupingBy(
                s -> s.getTeacher().getFullName(),
                Collectors.counting()
            ));
        statistics.put("teacherUtilization", teacherUtilization);
        
        // Classroom utilization
        Map<String, Long> classroomUtilization = schedules.stream()
            .collect(Collectors.groupingBy(
                s -> s.getClassroom().getRoomName(),
                Collectors.counting()
            ));
        statistics.put("classroomUtilization", classroomUtilization);
        
        // Subject distribution
        Map<String, Long> subjectDistribution = schedules.stream()
            .collect(Collectors.groupingBy(
                s -> s.getSubject().getName(),
                Collectors.counting()
            ));
        statistics.put("subjectDistribution", subjectDistribution);
        
        // Day distribution
        Map<String, Long> dayDistribution = schedules.stream()
            .collect(Collectors.groupingBy(
                s -> s.getDayOfWeek().toString(),
                Collectors.counting()
            ));
        statistics.put("dayDistribution", dayDistribution);
        
        return statistics;
    }
    
    // Inner class for scheduling requests
    public static class SchedulingRequest {
        private Section section;
        private Subject subject;
        private Integer requiredCapacity;
        private String roomType;
        private Integer priority;
        private Integer durationIndex;
        private Integer consecutiveHours; // Number of consecutive 30-minute blocks needed
        
        // Constructors
        public SchedulingRequest() {}
        
        // Getters and Setters
        public Section getSection() { return section; }
        public void setSection(Section section) { this.section = section; }
        
        public Subject getSubject() { return subject; }
        public void setSubject(Subject subject) { this.subject = subject; }
        
        public Integer getRequiredCapacity() { return requiredCapacity; }
        public void setRequiredCapacity(Integer requiredCapacity) { this.requiredCapacity = requiredCapacity; }
        
        public String getRoomType() { return roomType; }
        public void setRoomType(String roomType) { this.roomType = roomType; }
        
        public Integer getPriority() { return priority; }
        public void setPriority(Integer priority) { this.priority = priority; }
        
        public Integer getDurationIndex() { return durationIndex; }
        public void setDurationIndex(Integer durationIndex) { this.durationIndex = durationIndex; }
        
        public Integer getConsecutiveHours() { return consecutiveHours; }
        public void setConsecutiveHours(Integer consecutiveHours) { this.consecutiveHours = consecutiveHours; }
    }
}
