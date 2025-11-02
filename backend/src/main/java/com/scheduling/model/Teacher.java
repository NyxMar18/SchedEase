package com.scheduling.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;
import java.util.Set;

@Entity
@Table(name = "teachers")
public class Teacher {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "First name is required")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    private String lastName;
    
    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    @Column(unique = true)
    private String email;
    
    @ElementCollection
    private Set<String> subjects;
    
    @NotNull(message = "Available start time is required")
    private LocalTime availableStartTime;
    
    @NotNull(message = "Available end time is required")
    private LocalTime availableEndTime;
    
    @ElementCollection
    @Enumerated(EnumType.STRING)
    private Set<DayOfWeek> availableDays;
    
    private String phoneNumber;
    
    private String notes;
    
    // Constructors
    public Teacher() {}
    
    public Teacher(String firstName, String lastName, String email, Set<String> subjects, 
                   LocalTime availableStartTime, LocalTime availableEndTime, 
                   Set<DayOfWeek> availableDays) {
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.subjects = subjects;
        this.availableStartTime = availableStartTime;
        this.availableEndTime = availableEndTime;
        this.availableDays = availableDays;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getFirstName() {
        return firstName;
    }
    
    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }
    
    public String getLastName() {
        return lastName;
    }
    
    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public Set<String> getSubjects() {
        return subjects;
    }
    
    public void setSubjects(Set<String> subjects) {
        this.subjects = subjects;
    }
    
    public LocalTime getAvailableStartTime() {
        return availableStartTime;
    }
    
    public void setAvailableStartTime(LocalTime availableStartTime) {
        this.availableStartTime = availableStartTime;
    }
    
    public LocalTime getAvailableEndTime() {
        return availableEndTime;
    }
    
    public void setAvailableEndTime(LocalTime availableEndTime) {
        this.availableEndTime = availableEndTime;
    }
    
    public Set<DayOfWeek> getAvailableDays() {
        return availableDays;
    }
    
    public void setAvailableDays(Set<DayOfWeek> availableDays) {
        this.availableDays = availableDays;
    }
    
    public String getPhoneNumber() {
        return phoneNumber;
    }
    
    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public String getFullName() {
        return firstName + " " + lastName;
    }
    
    /**
     * Get all subjects this teacher can teach (includes backward compatibility)
     */
    public Set<String> getAllSubjects() {
        if (subjects != null && !subjects.isEmpty()) {
            return subjects;
        }
        // For backward compatibility, return empty set
        return new java.util.HashSet<>();
    }
}
