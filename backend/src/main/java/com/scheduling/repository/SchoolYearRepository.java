package com.scheduling.repository;

import com.scheduling.model.SchoolYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SchoolYearRepository extends JpaRepository<SchoolYear, Long> {
    
    Optional<SchoolYear> findByIsActiveTrue();
    
    Optional<SchoolYear> findByName(String name);
    
    List<SchoolYear> findAllByOrderByNameDesc();
    
    @Query("SELECT sy FROM SchoolYear sy WHERE sy.isActive = true")
    Optional<SchoolYear> findActiveSchoolYear();
    
    boolean existsByName(String name);
}

